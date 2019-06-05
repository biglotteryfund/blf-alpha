'use strict';
const express = require('express');
const path = require('path');
const Sentry = require('@sentry/node');
const moment = require('moment');
const concat = require('lodash/concat');
const findIndex = require('lodash/findIndex');
const flatMap = require('lodash/flatMap');
const get = require('lodash/get');
const head = require('lodash/head');
const isEmpty = require('lodash/isEmpty');
const partition = require('lodash/partition');
const set = require('lodash/set');
const unset = require('lodash/unset');
const debug = require('debug')('tnlcf:form-router');
const features = require('config').get('features');
const formidable = require('formidable');

const appData = require('../../../common/appData');
const applicationsService = require('../../../services/applications');
const cached = require('../../../middleware/cached');
const { requireUserAuth } = require('../../../middleware/authed');
const { injectCopy } = require('../../../middleware/inject-content');

const { FORM_STATES, calculateFormProgress } = require('./lib/progress');
const { nextAndPrevious } = require('./lib/pagination');
const validateForm = require('./lib/validate-form');
const salesforceService = require('./lib/salesforce');

function initFormRouter({
    id,
    eligibilityBuilder = null,
    formBuilder,
    confirmationBuilder
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
        (req, res, next) => {
            // Populate the request body using Formidable
            // instead of body-parser (which can't handle multipart forms)
            const formData = new formidable.IncomingForm();
            formData.parse(req, (err, fields, files) => {
                if (err) {
                    Sentry.captureException(err);
                } else {
                    req.body = fields;
                    req.files = files;
                }
                next();
            });
        },
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
            res.locals.enableSiteSurvey = false;
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
    router.route('/').get(async function(req, res, next) {
        function enrichApplication(application) {
            const data = get(application, 'application_data');

            const form = formBuilder({
                locale: req.i18n.getLocale(),
                data: data
            });

            application.summary = form.summary;

            const formProgress = calculateFormProgress(form, data);
            // @TODO: Lift this up to the form model?
            application.progress = form.sections.map(function(section, idx) {
                return {
                    label: `${idx + 1}: ${section.shortTitle || section.title}`,
                    status: get(formProgress.sections, section.slug)
                };
            });

            application.createdAtFormatted = moment(
                application.createdAt.toISOString()
            )
                .locale(req.i18n.getLocale())
                .format('D MMMM, YYYY');

            return application;
        }

        try {
            const applications = await applicationsService.getByForm({
                userId: req.user.userData.id,
                formId: id
            });

            const [submittedApplications, inProgressApplications] = partition(
                applications,
                application => application.status === 'complete'
            );

            res.render(path.resolve(__dirname, './views/dashboard'), {
                title: res.locals.formTitle,
                inProgressApplications: inProgressApplications.map(
                    enrichApplication
                ),
                submittedApplications: submittedApplications.map(
                    enrichApplication
                )
            });
        } catch (error) {
            next(error);
        }
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
                const currentApplication = await applicationsService.getApplicationById(
                    {
                        formId: id,
                        applicationId: currentEditingId,
                        userId: req.user.userData.id
                    }
                );

                if (currentApplication) {
                    const currentApplicationData = get(
                        currentApplication,
                        'application_data',
                        {}
                    );

                    res.locals.currentApplication = currentApplication;
                    res.locals.currentApplicationData = currentApplicationData;

                    res.locals.currentApplicationStatus = get(
                        currentApplication,
                        'status'
                    );

                    next();
                } else {
                    res.redirect(req.baseUrl);
                }
            } catch (error) {
                Sentry.captureException(
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
            form: form,
            breadcrumbs: concat(res.locals.breadcrumbs, { label: title }),
            progress: calculateFormProgress(form, currentApplicationData),
            currentProjectName: get(currentApplicationData, 'projectName')
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

            const validationResult = validateForm(form, currentApplicationData);

            if (validationResult.isValid) {
                next();
            } else {
                res.redirect(`${req.baseUrl}/summary`);
            }
        })
        .get(function(req, res) {
            res.render(path.resolve(__dirname, './views/terms'), {
                csrfToken: req.csrfToken()
            });
        })
        .post(async (req, res, next) => {
            const { currentApplication, currentApplicationData } = res.locals;

            const form = formBuilder({
                locale: req.i18n.getLocale(),
                data: currentApplicationData
            });

            // @TODO: Should we re-validate once more before submission?
            try {
                const shouldSend =
                    features.enableSalesforceConnector === true &&
                    !!process.env.TEST_SERVER === false;
                if (shouldSend) {
                    const salesforce = await salesforceService.authorise();
                    await salesforce.submitFormData(form.forSalesforce(), {
                        form: form.id,
                        environment: appData.environment,
                        commitId: appData.commitId,
                        startedAt: currentApplication.createdAt.toISOString()
                    });

                    /**
                     * @TODO: Determine file uploads to attach to record after submission
                     * recordId is the value returned by submitFormData on success
                     */
                    /*
                        await salesforce.contentVersion({
                          recordId: recordId,
                          // Some standard name for the file, not the original filename
                          attachmentName: 'bank-statement.pdf',
                          file: fileStream
                        });
                    */
                } else {
                    debug(`skipped salesforce submission for ${form.id}`);
                }

                await applicationsService.changeApplicationState(
                    res.locals.currentlyEditingId,
                    'complete'
                );

                res.redirect(`${req.baseUrl}/confirmation`);
            } catch (error) {
                next(error);
            }
        });

    /**
     * Route: Confirmation
     */
    router.get('/confirmation', function(req, res) {
        const { currentApplicationData, currentApplicationStatus } = res.locals;

        if (
            isEmpty(currentApplicationData) === false &&
            currentApplicationStatus === 'complete'
        ) {
            const form = formBuilder({
                locale: 'en',
                data: currentApplicationData
            });

            const confirmation = confirmationBuilder({
                locale: 'en',
                data: currentApplicationData
            });

            unset(req.session, sessionPrefix());
            req.session.save(() => {
                res.render(path.resolve(__dirname, './views/confirmation'), {
                    title: confirmation.title,
                    confirmation: confirmation,
                    form: form
                });
            });
        } else {
            res.redirect(req.baseUrl);
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
                const sectionShortTitle = section.shortTitle
                    ? section.shortTitle
                    : section.title;

                const sectionUrl = `${req.baseUrl}/${section.slug}`;

                if (stepNumber) {
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
                            const viewData = {
                                csrfToken: req.csrfToken(),
                                breadcrumbs: concat(
                                    res.locals.breadcrumbs,
                                    {
                                        label: sectionShortTitle,
                                        url: sectionUrl
                                    },
                                    { label: step.title }
                                ),
                                section: section,
                                step: step,
                                stepNumber: stepNumber,
                                totalSteps: section.steps.length,
                                previousUrl: previousUrl,
                                nextUrl: nextUrl,
                                errors: errors
                            };

                            res.render(
                                path.resolve(__dirname, './views/step'),
                                viewData
                            );
                        } else {
                            res.redirect(nextUrl);
                        }
                    } else {
                        res.redirect(req.baseUrl);
                    }
                } else if (section.introduction) {
                    const { nextUrl, previousUrl } = nextAndPrevious({
                        baseUrl: req.baseUrl,
                        sections: form.sections,
                        currentSectionIndex: sectionIndex
                    });

                    const viewData = {
                        section: section,
                        breadcrumbs: concat(res.locals.breadcrumbs, {
                            label: sectionShortTitle,
                            url: sectionUrl
                        }),
                        nextUrl: nextUrl,
                        previousUrl: previousUrl
                    };

                    res.render(
                        path.resolve(__dirname, './views/section-introduction'),
                        viewData
                    );
                } else {
                    res.redirect(`${sectionUrl}/1`);
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

            const validationResult = validateForm(form, data);

            try {
                await applicationsService.updateApplication(
                    currentlyEditingId,
                    validationResult.value
                );

                const fieldNamesForStep = flatMap(step.fieldsets, 'fields').map(
                    field => field.name
                );

                const errorsForStep = validationResult.messages.filter(item =>
                    fieldNamesForStep.includes(item.param)
                );

                /**
                 * If there are errors re-render the step with errors
                 * - Pass the full data object from validationResult to the view. Including invalid values.
                 * Otherwise, find the next suitable step and redirect there.
                 */
                if (errorsForStep.length > 0) {
                    const renderStep = renderStepFor(
                        req.params.section,
                        req.params.step
                    );
                    renderStep(req, res, validationResult.value, errorsForStep);
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
