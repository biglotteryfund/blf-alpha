'use strict';
const express = require('express');
const path = require('path');
const Raven = require('raven');
const {
    concat,
    findIndex,
    flatMap,
    get,
    head,
    includes,
    isEmpty,
    omit,
    set,
    unset
} = require('lodash');

const applicationsService = require('../../services/applications');
const cached = require('../../middleware/cached');
const { requireUserAuth } = require('../../middleware/authed');
const { injectCopy } = require('../../middleware/inject-content');

const { nextAndPrevious } = require('./lib/pagination');
const { FORM_STATES, calculateFormProgress } = require('./lib/progress');
const normaliseErrors = require('./lib/normalise-errors');

/**
 * Validate data against the form schema
 * Validating against the whole form ensures that
 * conditional validations are taken into account
 */
function validateDataFor(form, data) {
    return form.schema.validate(data, {
        // Return all errors not just the first one
        abortEarly: false,
        // Strip unknown properties.
        // Notably to allow us to ignore request forgery tokens as part of POST bodies
        stripUnknown: true
    });
}

function initFormRouter({
    id,
    eligibilityBuilder = null,
    formBuilder,
    processor
}) {
    const router = express.Router();

    function sessionPrefix() {
        return `forms.${id}`;
    }

    function getCurrentlyEditingId(req) {
        return get(req.session, `${sessionPrefix()}.currentEditingId`);
    }

    function setCurrentlyEditingId(req, applicationId) {
        return set(
            req.session,
            `${sessionPrefix()}.currentEditingId`,
            applicationId
        );
    }

    router.use(
        cached.csrfProtection,
        injectCopy('applyNext'),
        async (req, res, next) => {
            const form = formBuilder({
                locale: req.i18n.getLocale()
            });

            res.locals.formTitle = form.title;
            res.locals.formBaseUrl = req.baseUrl;
            res.locals.FORM_STATES = FORM_STATES;
            res.locals.breadcrumbs = [{ label: form.title, url: req.baseUrl }];

            res.locals.user = req.user;
            res.locals.isBilingual = form.isBilingual;
            res.locals.enablePrompt = false; // Disable prompts on apply pages
            res.locals.bodyClass = 'has-static-header'; // No hero images on apply pages

            next();
        }
    );

    /**
     * Show a list of questions, accessible to anyone.
     */
    router.use('/questions', require('./questions-router')(formBuilder));

    /**
     * Route: Eligibility checker, accessible to anyone.
     */
    router.use(
        '/eligibility',
        require('./eligibility-router')(eligibilityBuilder)
    );

    /**
     * Require login, redirect back here once authenticated.
     */
    router.use(requireUserAuth);

    /**
     * Route: Dashboard
     */
    router.route('/').get(async function(req, res) {
        const applications = await applicationsService.getApplicationsForUser({
            formId: id,
            userId: req.user.userData.id
        });

        const form = formBuilder({
            locale: req.i18n.getLocale()
        });

        const applicationsWithProgress = applications.map(application => {
            application.progress = calculateFormProgress(
                form,
                get(application, 'application_data')
            );
            return application;
        });

        res.render(path.resolve(__dirname, './views/dashboard'), {
            title: res.locals.formTitle,
            applications: applicationsWithProgress,
            form: form
        });
    });

    /**
     * Start application
     * Redirect to eligibility checker
     */
    router.get('/start', function(req, res) {
        res.redirect(`${req.baseUrl}/eligibility/1`);
    });

    /**
     * New application
     * Create a new blank application and redirect to first step
     */
    router.get('/new', async function(req, res, next) {
        const form = formBuilder({
            locale: req.i18n.getLocale()
        });

        try {
            const application = await applicationsService.createApplication({
                formId: id,
                userId: req.user.userData.id
            });

            setCurrentlyEditingId(req, application.id);
            req.session.save(() => {
                const firstSection = head(form.sections);
                res.redirect(`${req.baseUrl}/${firstSection.slug}`);
            });
        } catch (error) {
            next(error);
        }
    });

    /**
     * Route: Edit application ID
     * Store the ID of the application currently being edited
     */
    router.get('/edit/:applicationId', async (req, res) => {
        if (req.params.applicationId) {
            setCurrentlyEditingId(req, req.params.applicationId);
            req.session.save(() => {
                res.redirect(`${req.baseUrl}/summary`);
            });
        } else {
            res.redirect(req.baseUrl);
        }
    });

    /**
     * Route: Delete application
     * Allow an application owned by this user to be deleted
     */
    router
        .route('/delete/:applicationId')
        .get(async (req, res) => {
            if (req.params.applicationId && req.user.userData.id) {
                const application = await applicationsService.getApplicationById(
                    {
                        formId: id,
                        applicationId: req.params.applicationId,
                        userId: req.user.userData.id
                    }
                );

                if (!application) {
                    return res.redirect(req.baseUrl);
                }

                res.render(path.resolve(__dirname, './views/delete'), {
                    title: res.locals.formTitle,
                    csrfToken: req.csrfToken()
                });
            } else {
                res.redirect(req.baseUrl);
            }
        })
        .post(async (req, res, next) => {
            try {
                await applicationsService.deleteApplication(
                    req.params.applicationId,
                    req.user.userData.id
                );
                // @TODO show a success message on the subsequent (dashboard?) screen
                res.redirect(req.baseUrl);
            } catch (error) {
                next(error);
            }
        });

    /**
     * Require application
     * All routes after this point require an application to be selected
     */
    router.use(async (req, res, next) => {
        const currentEditingId = getCurrentlyEditingId(req);
        if (currentEditingId) {
            res.locals.currentlyEditingId = currentEditingId;

            try {
                const application = await applicationsService.getApplicationById(
                    {
                        formId: id,
                        applicationId: currentEditingId,
                        userId: req.user.userData.id
                    }
                );

                if (application) {
                    const currentApplicationData = get(
                        application,
                        'application_data',
                        {}
                    );
                    res.locals.currentApplicationData = currentApplicationData;
                    res.locals.currentApplicationStatus = get(
                        application,
                        'status'
                    );

                    res.locals.form = formBuilder({
                        locale: req.i18n.getLocale(),
                        data: currentApplicationData
                    });
                    next();
                } else {
                    res.redirect(req.baseUrl);
                }
            } catch (error) {
                Raven.captureException(
                    new Error(`Unable to find application ${currentEditingId}`)
                );
                res.redirect(req.baseUrl);
            }
        } else {
            res.redirect(req.baseUrl);
        }
    });

    /**
     * Route: Summary
     */
    router.route('/summary').get(function(req, res) {
        const { copy, currentApplicationData } = res.locals;

        const form = formBuilder({
            locale: req.i18n.getLocale(),
            data: currentApplicationData
        });

        const title = copy.summary.title;

        res.render(path.resolve(__dirname, './views/summary'), {
            csrfToken: req.csrfToken(),
            title: title,
            breadcrumbs: concat(res.locals.breadcrumbs, { label: title }),
            progress: calculateFormProgress(form, currentApplicationData),
            currentApplicationTitle: get(currentApplicationData, 'project-name')
        });
    });

    /**
     * Route: Terms and Conditions
     */
    router
        .route('/terms')
        .all((req, res, next) => {
            const { currentApplicationData } = res.locals;
            res.locals.breadcrumbs = concat(res.locals.breadcrumbs, {
                label: 'Terms & Conditions'
            });

            const form = formBuilder({
                locale: req.i18n.getLocale(),
                data: currentApplicationData
            });

            res.locals.form = form;

            const validationResult = validateDataFor(
                form,
                currentApplicationData
            );

            const errors = get(validationResult, 'error.details', []);

            if (errors.length > 0) {
                res.redirect(`${req.baseUrl}/summary`);
            } else {
                next();
            }
        })
        .get(function(req, res) {
            res.render(path.resolve(__dirname, './views/terms'), {
                csrfToken: req.csrfToken()
            });
        })
        .post(async (req, res, next) => {
            try {
                await processor({
                    form: res.locals.form,
                    data: res.locals.currentApplicationData
                });
                await applicationsService.changeApplicationState(
                    res.locals.currentlyEditingId,
                    'complete'
                );
                res.redirect(`${req.baseUrl}/success`);
            } catch (error) {
                next(error);
            }
        });

    /**
     * Route: Success
     */
    router.get('/success', function(req, res) {
        if (isEmpty(res.locals.currentApplicationData)) {
            res.redirect(req.baseUrl);
        } else {
            // Clear the submission from the session on success
            unset(req.session, sessionPrefix());
            req.session.save(() => {
                res.render(path.resolve(__dirname, './views/success'), {
                    form: res.locals.form,
                    title: 'Success'
                });
            });
        }
    });

    function renderStepFor(sectionSlug, stepNumber) {
        return function(req, res, data, errors = []) {
            const form = formBuilder({
                locale: req.i18n.getLocale(),
                data: data
            });

            const sectionIndex = findIndex(
                form.sections,
                s => s.slug === sectionSlug
            );

            const section = form.sections[sectionIndex];

            if (section) {
                const stepIndex = parseInt(stepNumber, 10) - 1;
                const step = section.steps[stepIndex];

                if (step) {
                    const { nextUrl, previousUrl } = nextAndPrevious({
                        baseUrl: req.baseUrl,
                        sections: form.sections,
                        currentSectionIndex: sectionIndex,
                        currentStepIndex: stepIndex
                    });

                    if (step.isRequired) {
                        const sectionShortTitle = section.shortTitle
                            ? section.shortTitle
                            : section.title;

                        const breadcrumbs = concat(
                            res.locals.breadcrumbs,
                            {
                                label: sectionShortTitle,
                                url: `${req.baseUrl}/${section.slug}`
                            },
                            { label: step.title }
                        );

                        const title = `${step.title} | ${sectionShortTitle} | ${
                            form.title
                        }`;

                        res.render(path.resolve(__dirname, './views/step'), {
                            csrfToken: req.csrfToken(),
                            title: title,
                            breadcrumbs: breadcrumbs,
                            section: section,
                            step: step,
                            stepNumber: stepNumber,
                            totalSteps: section.steps.length,
                            previousUrl: previousUrl,
                            nextUrl: nextUrl,
                            errors: errors
                        });
                    } else {
                        res.redirect(nextUrl);
                    }
                } else {
                    res.redirect(`${req.baseUrl}/${section.slug}/1`);
                }
            } else {
                res.redirect(req.baseUrl);
            }
        };
    }

    /**
     * Routes: Form sections
     */
    router
        .route('/:section/:step?')
        .get((req, res) => {
            const renderStep = renderStepFor(
                req.params.section,
                req.params.step
            );
            renderStep(req, res, res.locals.currentApplicationData);
        })
        .post(async (req, res, next) => {
            const { currentlyEditingId, currentApplicationData } = res.locals;
            const data = { ...currentApplicationData, ...req.body };

            const form = formBuilder({
                locale: req.i18n.getLocale(),
                data: data
            });

            const sectionIndex = findIndex(
                form.sections,
                section => section.slug === req.params.section
            );
            const currentSection = form.sections[sectionIndex];

            const stepIndex = parseInt(req.params.step, 10) - 1;
            const step = currentSection.steps[stepIndex];
            const fields = flatMap(step.fieldsets, 'fields');

            const validationResult = validateDataFor(form, data);

            const errorDetailsForStep = get(
                validationResult.error,
                'details',
                []
            ).filter(detail =>
                includes(fields.map(field => field.name), head(detail.path))
            );

            try {
                // Exclude any values in the current submission which have errors
                const dataToStore = omit(
                    validationResult.value,
                    errorDetailsForStep.map(detail => head(detail.path))
                );
                await applicationsService.updateApplication(
                    currentlyEditingId,
                    dataToStore
                );

                const normalisedErrors = normaliseErrors({
                    errorDetails: errorDetailsForStep,
                    errorMessages: fields.reduce((obj, field) => {
                        obj[field.name] = field.messages;
                        return obj;
                    }, {})
                });

                /**
                 * If there are errors re-render the step with errors
                 * - Pass the full data object from validationResult to the view. Including invalid values.
                 * Otherwise, find the next suitable step and redirect there.
                 */
                if (normalisedErrors.length > 0) {
                    const renderStep = renderStepFor(
                        req.params.section,
                        req.params.step
                    );
                    renderStep(
                        req,
                        res,
                        validationResult.value,
                        normalisedErrors
                    );
                } else {
                    const { nextUrl } = nextAndPrevious({
                        baseUrl: req.baseUrl,
                        sections: form.sections,
                        currentSectionIndex: sectionIndex,
                        currentStepIndex: stepIndex
                    });
                    res.redirect(nextUrl);
                }
            } catch (error) {
                next(error);
            }
        });

    return router;
}

module.exports = {
    initFormRouter
};
