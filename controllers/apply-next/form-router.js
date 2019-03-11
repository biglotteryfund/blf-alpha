'use strict';
const { concat, head, isEmpty, omit, get, set, unset } = require('lodash');
const express = require('express');
const path = require('path');
const Raven = require('raven');

const cached = require('../../middleware/cached');
const { requireUserAuth } = require('../../middleware/authed');
const applicationsService = require('../../services/applications');

const { normaliseErrors } = require('../../modules/errors');
const {
    FORM_STATES,
    calculateFormProgress,
    enhanceForm,
    fieldsForStep,
    mapFields,
    nextAndPrevious
} = require('./helpers');

function initFormRouter(formModel) {
    const router = express.Router();

    const SESSION_PREFIX = `forms.${formModel.id}`;

    router.use(cached.csrfProtection);

    /**
     * Require login, redirect back here once authenticated.
     */
    router.use(requireUserAuth);

    /**
     * Set common locals
     */
    router.use(async (req, res, next) => {
        // Translate the form object for each request and populate it with current user input
        const form = enhanceForm({
            locale: req.i18n.getLocale(),
            baseForm: formModel
        });

        res.locals.formTitle = form.title;
        res.locals.formBaseUrl = req.baseUrl;
        res.locals.FORM_STATES = FORM_STATES;
        res.locals.breadcrumbs = [{ label: form.title, url: req.baseUrl }];

        res.locals.user = req.user;
        res.locals.isBilingual = formModel.isBilingual;
        res.locals.enablePrompt = false; // Disable prompts on apply pages
        res.locals.bodyClass = 'has-static-header'; // No hero images on apply pages

        next();
    });

    /**
     * Route: Dashboard
     */
    router.route('/').get(async function(req, res) {
        const applications = await applicationsService.getApplicationsForUser({
            userId: req.user.userData.id,
            formId: formModel.id
        });

        res.render(path.resolve(__dirname, './views/dashboard'), {
            title: res.locals.formTitle,
            applications
        });
    });

    /**
     * Route: New Application
     */
    function renderNewApplication(req, res, data = null, errors = []) {
        const form = enhanceForm({
            locale: req.i18n.getLocale(),
            baseForm: formModel,
            data: data
        });

        res.render(path.resolve(__dirname, './views/new'), {
            title: res.locals.formTitle,
            csrfToken: req.csrfToken(),
            fields: form.newApplicationFields,
            errors: errors
        });
    }

    router
        .route('/new')
        .get(function(req, res) {
            renderNewApplication(req, res);
        })
        .post(async (req, res) => {
            const validationResult = formModel.schema.validate(req.body, {
                abortEarly: false,
                stripUnknown: true,
                escapeHtml: true
            });

            const fields = mapFields(formModel.newApplicationFields);
            const errors = normaliseErrors({
                validationError: validationResult.error,
                errorMessages: fields.messages,
                fieldNames: fields.names,
                locale: req.i18n.getLocale()
            });

            if (errors.length > 0) {
                renderNewApplication(req, res, validationResult.value, errors);
            } else {
                try {
                    const application = await applicationsService.createApplication({
                        userId: req.user.userData.id,
                        formId: formModel.id,
                        title: get(validationResult.value, 'application-title'),
                        data: validationResult.value
                    });

                    res.redirect(`${req.baseUrl}/edit/${application.id}`);
                } catch (error) {
                    Raven.captureException(error);
                    renderError(error, req, res);
                }
            }
        });

    /**
     * Route: Edit application ID
     * Store the ID of the application currently being edited
     */
    router.get('/edit/:applicationId', async (req, res) => {
        const { applicationId } = req.params;
        if (applicationId) {
            set(req.session, `${SESSION_PREFIX}.currentEditingId`, applicationId);
            req.session.save(() => {
                const firstSection = head(formModel.sections);
                res.redirect(`${req.baseUrl}/${firstSection.slug}`);
            });
        } else {
            res.redirect(req.baseUrl);
        }
    });

    // Allow an application owned by this user to be deleted
    router
        .route('/delete/:applicationId')
        .get((req, res) => {
            if (req.params.applicationId && req.user.userData.id) {
                res.render(path.resolve(__dirname, './views/delete'), {
                    title: res.locals.formTitle,
                    csrfToken: req.csrfToken()
                });
            } else {
                res.redirect(req.baseUrl);
            }
        })
        .post(async (req, res) => {
            const deleteApplication = applicationsService.deleteApplication(
                req.params.applicationId,
                req.user.userData.id
            );
            deleteApplication
                .then(() => {
                    // @TODO show a success message on the subsequent (dashboard?) screen
                    res.redirect(req.baseUrl);
                })
                .catch(error => {
                    renderError(error, req, res);
                });
        });

    /**
     * Require application
     * All routes after this point require an application to be selected
     */
    router.use(async (req, res, next) => {
        const currentEditingId = get(req.session, `${SESSION_PREFIX}.currentEditingId`);

        if (currentEditingId) {
            res.locals.currentlyEditingId = currentEditingId;

            try {
                const application = await applicationsService.getApplicationById({
                    formId: formModel.id,
                    applicationId: currentEditingId
                });

                if (application) {
                    const currentApplicationData = get(application, 'application_data');
                    res.locals.currentApplicationTitle = get(application, 'application_title');
                    res.locals.currentApplicationData = currentApplicationData;

                    res.locals.form = enhanceForm({
                        locale: req.i18n.getLocale(),
                        baseForm: formModel,
                        data: currentApplicationData
                    });
                    next();
                } else {
                    res.redirect(req.baseUrl);
                }
            } catch (error) {
                Raven.captureException(new Error(`Unable to find application ${currentEditingId}`));
                res.redirect(req.baseUrl);
            }
        } else {
            res.redirect(req.baseUrl);
        }
    });

    /**
     * Route: Eligibility checker
     */

    router
        .route('/eligibility/:step?')
        .all((req, res, next) => {
            // @TODO i18n - move these to locale files when they're signed off
            res.locals.eligibilityQuestions = [
                {
                    question: 'Does your organisation have at least two unconnected people on the board or committee?',
                    explanation:
                        'By unconnected, we mean not a relation by blood, marriage, in a long-term relationship or people living together at the same address.',
                    ineligibleReason:
                        'This is because you declared that your organisation does not have at least two unconnected people on the board or committee'
                },
                {
                    question:
                        'Are you applying for an amount between £300 and £10,000 for a project that will be finished within about 12 months?',
                    explanation:
                        "We know it's not always possible to complete a project in 12 months for lots of reasons. We can therefore consider projects which are slightly longer than this. We will also consider applications for one-off events such as a festival, gala day or conference.",
                    ineligibleReason:
                        'This is because you declared that your organisation does not need an amount between £300 and £10,000 for a project that will be finished within about 12 months.'
                },
                {
                    question:
                        'Does your project start at least 12 weeks from when you plan to submit your application?',
                    explanation:
                        "We need 12 weeks to be able to assess your application and pay your grant, if you're successful. Therefore, projects need to start at least 12 weeks from the date you submit your application to us.",
                    ineligibleReason:
                        "This is because you declared that your project doesn't start at least 12 weeks from when we plan to submit your application."
                },
                {
                    question:
                        'Do you have a UK bank account in the legal name of your organisation, with at least two unrelated people who are able to manage the account?',
                    explanation:
                        "This should be the legal name of your organisation as it appears on your bank statement, not the name of your bank. This will usually be the same as your organisation's name on your governing document.",
                    ineligibleReason:
                        "This is because you declared that your organisation doesn't have a UK bank account in the name of your organisation."
                },
                {
                    question:
                        "Do you produce annual accounts (or did you set up your organisation less than 15 months ago and haven't produced annual accounts yet)?",
                    explanation:
                        "By annual accounts, we mean a summary of your financial activity. If you are a small organisation, this may be produced by your board and doesn't have to be done by an accountant.",
                    ineligibleReason:
                        "This is because you declared that your organisation hasn't produced annual accounts, or that your your organisation was set up less than 15 months ago and has not yet produced annual accounts."
                }
            ];
            if (!req.params.step || req.params.step > res.locals.eligibilityQuestions.length) {
                res.redirect(`${req.baseUrl}/eligibility/1`);
            } else {
                // @TODO check progress and prevent skipping ahead
                res.locals.currentStep = res.locals.eligibilityQuestions[req.params.step - 1];
                next();
            }
        })
        .get((req, res) => {
            res.render(path.resolve(__dirname, './views/eligibility'), {
                eligibility: 'pending',
                csrfToken: req.csrfToken(),
                currentStepNumber: req.params.step,
                questions: res.locals.eligibilityQuestions
            });
        })
        .post((req, res) => {
            const stepAnswer = req.body.eligibility;
            if (!stepAnswer || stepAnswer !== 'yes') {
                res.render(path.resolve(__dirname, './views/eligibility'), {
                    eligibility: 'ineligible'
                });
            } else {
                const isComplete = parseInt(req.params.step) === res.locals.eligibilityQuestions.length;
                if (!isComplete) {
                    res.redirect(`${req.baseUrl}/eligibility/${parseInt(req.params.step) + 1}`);
                } else {
                    res.render(path.resolve(__dirname, './views/eligibility'), {
                        eligibility: 'eligible'
                    });
                }
            }
        });

    /**
     * Routes: Form sections
     */
    formModel.sections.forEach((currentSection, currentSectionIndex) => {
        router.get(`/${currentSection.slug}`, (req, res) => {
            res.redirect(`${req.baseUrl}/${currentSection.slug}/1`);
        });

        /**
         * Route: Section steps
         */
        currentSection.steps.forEach((currentStep, currentStepIndex) => {
            const currentStepNumber = currentStepIndex + 1;
            const numSteps = currentSection.steps.length;
            const stepFields = fieldsForStep(currentStep);

            function renderStep(req, res, data, errors = []) {
                const form = enhanceForm({
                    locale: req.i18n.getLocale(),
                    baseForm: formModel,
                    data: data
                });

                const sectionLocalised = form.sections.find(s => s.slug === currentSection.slug);
                const stepLocalised = sectionLocalised.steps[currentStepIndex];

                res.locals.breadcrumbs = concat(
                    res.locals.breadcrumbs,
                    { label: sectionLocalised.title, url: `${req.baseUrl}/${currentSection.slug}` },
                    { label: `${stepLocalised.title} (Step ${currentStepNumber} of ${numSteps})` }
                );

                const { nextUrl, previousUrl } = nextAndPrevious({
                    baseUrl: req.baseUrl,
                    sections: formModel.sections,
                    currentSectionIndex: currentSectionIndex,
                    currentStepIndex: currentStepIndex,
                    formData: data
                });

                const shouldRender = currentStep.matchesCondition ? currentStep.matchesCondition(data) === true : true;
                if (shouldRender) {
                    res.render(path.resolve(__dirname, './views/step'), {
                        previousUrl,
                        nextUrl,
                        title: `${stepLocalised.title} | ${form.title}`,
                        csrfToken: req.csrfToken(),
                        step: stepLocalised,
                        errors: errors
                    });
                } else {
                    res.redirect(nextUrl);
                }
            }

            router
                .route(`/${currentSection.slug}/${currentStepNumber}`)
                .get((req, res) => {
                    renderStep(req, res, res.locals.currentApplicationData);
                })
                .post(async function(req, res) {
                    const { currentlyEditingId, currentApplicationData } = res.locals;

                    /**
                     * Validate the all the data so far against validation schema
                     * - Validating against the whole form ensures that conditional validations are taken into account
                     * - We include `stripUnknown` to exclude any values that are required in the POST body,
                     *   like request forgery tokens, but not needed as part of the submission data.
                     * @see https://github.com/hapijs/joi/blob/master/API.md#validatevalue-schema-options-callback
                     */
                    const dataToValidate = { ...currentApplicationData, ...req.body };
                    const validationResult = formModel.schema.validate(dataToValidate, {
                        abortEarly: false,
                        stripUnknown: true,
                        escapeHtml: true
                    });

                    /**
                     * Get the errors for the current step
                     * We validate against the whole form schema so need to limit the errors to the current step
                     */
                    const errors = normaliseErrors({
                        validationError: validationResult.error,
                        errorMessages: stepFields.messages,
                        fieldNames: stepFields.names,
                        locale: req.i18n.getLocale()
                    });

                    /**
                     * Prepare data for storage
                     * Exclude any values in the current submission which have errors
                     */
                    const newFormData = omit(validationResult.value, errors.map(err => err.param));

                    try {
                        await applicationsService.updateApplication(currentlyEditingId, newFormData);

                        /**
                         * If there are errors re-render the step with errors
                         * - Pass the full data object from validationResult to the view. Including invalid values.
                         * Otherwise, find the next suitable step and redirect there.
                         */
                        if (errors.length > 0) {
                            renderStep(req, res, validationResult.value, errors);
                        } else {
                            const { nextUrl } = nextAndPrevious({
                                baseUrl: req.baseUrl,
                                sections: formModel.sections,
                                currentSectionIndex: currentSectionIndex,
                                currentStepIndex: currentStepIndex,
                                formData: newFormData
                            });
                            res.redirect(nextUrl);
                        }
                    } catch (error) {
                        renderError(error, req, res);
                    }
                });
        });
    });

    function renderError(error, req, res) {
        const errorCopy = req.i18n.__('apply.error');
        res.render(path.resolve(__dirname, './views/error'), {
            error: error,
            title: errorCopy.title,
            errorCopy: errorCopy,
            returnUrl: `${req.baseUrl}/summary`
        });
    }

    /**
     * Route: Summary
     */
    router.route('/summary').get(function(req, res) {
        const { form, currentApplicationData } = res.locals;
        res.locals.breadcrumbs = concat(res.locals.breadcrumbs, { label: 'Summary' });
        res.render(path.resolve(__dirname, './views/summary'), {
            progress: calculateFormProgress(form, currentApplicationData),
            csrfToken: req.csrfToken()
        });
    });

    /**
     * Route: Terms and Conditions
     */
    router
        .route('/terms')
        .all((req, res, next) => {
            const { currentApplicationData } = res.locals;
            res.locals.breadcrumbs = concat(res.locals.breadcrumbs, { label: 'Terms & Conditions' });

            res.locals.form = enhanceForm({
                locale: req.i18n.getLocale(),
                baseForm: formModel,
                data: currentApplicationData
            });

            const validationResult = formModel.schema.validate(currentApplicationData, {
                abortEarly: false,
                stripUnknown: true
            });

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
        .post(async (req, res) => {
            // @TODO: Validate fields on terms screen?
            try {
                await formModel.processor({
                    form: res.locals.form,
                    data: res.locals.currentApplicationData
                });
                await applicationsService.changeApplicationState(res.locals.currentlyEditingId, 'complete');
                res.redirect(`${req.baseUrl}/success`);
            } catch (error) {
                Raven.captureException(error);
                renderError(error, req, res);
            }
        });

    /**
     * Route: Success
     */
    router.get('/success', function(req, res) {
        const stepConfig = formModel.successStep;
        if (isEmpty(res.locals.currentApplicationData)) {
            res.redirect(req.baseUrl);
        } else {
            // Clear the submission from the session on success
            unset(req.session, SESSION_PREFIX);
            req.session.save(() => {
                res.render(stepConfig.template, {
                    form: res.locals.form,
                    title: 'Success'
                });
            });
        }
    });

    return router;
}

module.exports = {
    initFormRouter
};
