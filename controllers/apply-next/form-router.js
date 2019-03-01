'use strict';
const { concat, difference, flatMap, isEmpty, includes, pick, set } = require('lodash');
const { get, getOr } = require('lodash/fp');
const express = require('express');
const path = require('path');
const Raven = require('raven');

const cached = require('../../middleware/cached');
const { requireUserAuth } = require('../../middleware/authed');
const applicationsService = require('../../services/applications');

const { FORM_STATES, findNextMatchingStepIndex, prepareForm, injectFormState, normaliseErrors } = require('./helpers');

function initFormRouter(formModel) {
    const router = express.Router();

    const sessionKeys = {
        form: formModel.sessionKey,
        editingId: 'currentEditingId'
    };

    // Require login and redirect users back here once authorised
    router.use((req, res, next) => {
        req.session.redirectUrl = req.baseUrl;
        req.session.save(() => {
            next();
        });
    }, requireUserAuth);

    router.use(cached.csrfProtection, async (req, res, next) => {
        res.locals.setSessionData = (dataPath, value) => set(req.session, `${sessionKeys.form}.${dataPath}`, value);
        res.locals.getSessionData = dataPath => get(`${sessionKeys.form}.${dataPath}`)(req.session);
        res.locals.clearSession = () => delete req.session[sessionKeys.form];

        // Look up the current application data
        let applicationData = {};
        res.locals.currentlyEditingId = res.locals.getSessionData(sessionKeys.editingId);
        if (res.locals.currentlyEditingId) {
            applicationData = await applicationsService.getApplicationById(
                sessionKeys.form,
                res.locals.currentlyEditingId
            );
        }
        res.locals.currentApplicationData = applicationData ? applicationData.application_data : false;

        // Translate the form object for each request and populate it with current user input
        res.locals.form = prepareForm(req.i18n.getLocale(), formModel, res.locals.currentApplicationData);

        // Share some useful form variables
        res.locals.FORM_STATES = FORM_STATES;
        res.locals.user = req.user;

        res.locals.formBaseUrl = req.baseUrl;
        res.locals.formTitle = 'Application form: ' + res.locals.form.title;
        res.locals.isBilingual = formModel.isBilingual;
        res.locals.enablePrompt = false; // Disable prompts on apply pages
        res.locals.bodyClass = 'has-static-header'; // No hero images on apply pages
        res.locals.breadcrumbs = [{ label: res.locals.form.title, url: req.baseUrl }];

        next();
    });

    /**
     * Route: Start page
     */
    async function renderStartPage(req, res, errors = []) {
        const { startPage } = res.locals.form;
        const applications = await applicationsService.getApplicationsForUser(req.user.userData.id, sessionKeys.form);

        res.render(startPage.template, {
            title: res.locals.formTitle,
            applications: applications,
            csrfToken: req.csrfToken(),
            errors: errors
        });
    }

    router
        .route('/')
        .get(async function(req, res) {
            renderStartPage(req, res);
        })
        .post(async (req, res) => {
            try {
                const application = applicationsService.createApplication({
                    userId: req.user.userData.id,
                    formId: sessionKeys.form,
                    // @TODO: Validate the title field
                    title: req.body['application-title']
                });
                res.redirect(`${req.baseUrl}/edit/${application.id}`);
            } catch (error) {
                Raven.captureException(error);
                renderError(error, req, res);
            }
        });

    // Store the ID of the application currently being edited
    router.get('/edit/:applicationId', async (req, res) => {
        if (req.params.applicationId) {
            res.locals.setSessionData(sessionKeys.editingId, req.params.applicationId);
            req.session.save(() => {
                const firstSection = res.locals.form.sections[0];
                res.redirect(`${req.baseUrl}/${firstSection.slug}`);
            });
        } else {
            res.redirect(req.baseUrl);
        }
    });

    // All routes after this point require an ID to be selected for an application
    router.use((req, res, next) => {
        if (!res.locals.currentlyEditingId) {
            return res.redirect(req.baseUrl);
        }
        next();
    });

    formModel.sections.forEach((sectionModel, sectionIndex) => {
        router.get(`/${sectionModel.slug}`, (req, res) => {
            res.redirect(`${req.baseUrl}/${sectionModel.slug}/1`);
        });

        /**
         * Route: Section steps
         */
        sectionModel.steps.forEach((stepModel, stepIndex) => {
            const currentStepNumber = stepIndex + 1;
            const numSteps = sectionModel.steps.length;
            const nextSection = formModel.sections[sectionIndex + 1];
            const fieldsForStep = flatMap(stepModel.fieldsets, 'fields');
            const fieldNamesForStep = fieldsForStep.map(field => field.name);

            function redirectNext(nextMatchingStepIndex, req, res) {
                if (nextMatchingStepIndex !== -1 && nextMatchingStepIndex <= sectionModel.steps.length) {
                    res.redirect(`${req.baseUrl}/${sectionModel.slug}/${nextMatchingStepIndex + 1}`);
                } else if (nextSection) {
                    res.redirect(`${req.baseUrl}/${nextSection.slug}`);
                } else {
                    res.redirect(`${req.baseUrl}/summary`);
                }
            }

            function renderStep(req, res, data, errors = []) {
                const form = prepareForm(req.i18n.getLocale(), formModel, data);

                const sectionLocalised = form.sections.find(s => s.slug === sectionModel.slug);
                const stepLocalised = sectionLocalised.steps[stepIndex];

                res.locals.breadcrumbs = concat(
                    res.locals.breadcrumbs,
                    { label: sectionLocalised.title, url: `${req.baseUrl}/${sectionModel.slug}` },
                    { label: `${stepLocalised.title} (Step ${currentStepNumber} of ${numSteps})` }
                );

                const nextMatchingStepIndex = findNextMatchingStepIndex({
                    steps: sectionModel.steps,
                    startIndex: stepIndex,
                    formData: data
                });

                if (nextMatchingStepIndex === stepIndex) {
                    res.render(path.resolve(__dirname, './views/step'), {
                        title: `${stepLocalised.title} | ${res.locals.form.title}`,
                        csrfToken: req.csrfToken(),
                        step: stepLocalised,
                        errors: errors
                    });
                } else {
                    redirectNext(nextMatchingStepIndex, req, res);
                }
            }

            router
                .route(`/${sectionModel.slug}/${currentStepNumber}`)
                .get((req, res) => {
                    renderStep(req, res, res.locals.currentApplicationData);
                })
                .post(async function handleSubmitStep(req, res) {
                    const { currentlyEditingId, currentApplicationData } = res.locals;

                    /**
                     * Validate the current request body against our validation schema
                     * @see https://github.com/hapijs/joi/blob/master/API.md#validatevalue-schema-options-callback
                     * We include `stripUnknown` to exclude any values that are required in
                     * the POST body, like CSRF tokens, but not needed as part of the submission.
                     */
                    const validationResult = formModel.schema.validate(req.body, {
                        abortEarly: false,
                        stripUnknown: true
                    });

                    /**
                     * Get the errors for the current step
                     * We validate against the whole form schema so need to limit the errors to the current step
                     */
                    const errorDetails = getOr([], 'error.details')(validationResult);
                    const errorsForStep = errorDetails.filter(detail =>
                        includes(fieldNamesForStep, detail.context.key)
                    );

                    /**
                     * Prepare data for storage
                     * Excludes any values in the current submission which have errors
                     */
                    const goodKeys = difference(fieldNamesForStep, errorsForStep.map(detail => detail.context.key));
                    const newDataToStore = pick(validationResult.value, goodKeys);
                    const newFormData = { ...currentApplicationData, ...newDataToStore };

                    try {
                        await applicationsService.updateApplication(currentlyEditingId, newFormData);

                        /**
                         * If there are errors re-render the step with errors
                         * - Pass the full data object from validationResult to the view. Including invalid values.
                         * Otherwise, find the next suitable step and redirect there.
                         */
                        if (errorsForStep.length > 0) {
                            const errors = normaliseErrors({
                                fields: fieldsForStep,
                                errors: errorsForStep,
                                locale: req.i18n.getLocale()
                            });
                            renderStep(req, res, validationResult.value, errors);
                        } else {
                            const nextMatchingStepIndex = findNextMatchingStepIndex({
                                steps: sectionModel.steps,
                                startIndex: stepIndex + 1,
                                formData: newFormData
                            });
                            redirectNext(nextMatchingStepIndex, req, res);
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
        const validatedForm = injectFormState(form, currentApplicationData);
        res.render(path.resolve(__dirname, './views/summary'), {
            form: validatedForm,
            csrfToken: req.csrfToken()
        });
    });

    /**
     * Route: Terms and Conditions
     */
    router
        .route('/terms')
        .all((req, res, next) => {
            res.locals.breadcrumbs = concat(res.locals.breadcrumbs, { label: 'Terms & Conditions' });

            res.locals.form = prepareForm(req.i18n.getLocale(), formModel, res.locals.currentApplicationData);

            const validationResult = formModel.schema.validate(res.locals.currentApplicationData, {
                abortEarly: false,
                stripUnknown: true
            });

            const errors = getOr([], 'error.details', validationResult);

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
            res.locals.clearSession();
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
