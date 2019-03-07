'use strict';
const { concat, flatMap, isEmpty, omit, set, isArray } = require('lodash');
const { get, getOr } = require('lodash/fp');
const express = require('express');
const path = require('path');
const Raven = require('raven');

const cached = require('../../middleware/cached');
const { requireUserAuth } = require('../../middleware/authed');
const applicationsService = require('../../services/applications');

const {
    FORM_STATES,
    calculateFormProgress,
    enhanceForm,
    filterErrors,
    nextAndPrevious,
    normaliseErrors
} = require('./helpers');

function initFormRouter(formModel) {
    const router = express.Router();

    const sessionKeys = {
        form: formModel.sessionKey,
        editingId: 'currentEditingId'
    };

    router.use(cached.csrfProtection);

    /**
     * Require login, redirect back here once authenticated.
     */
    router.use((req, res, next) => {
        req.session.redirectUrl = req.baseUrl;
        req.session.save(() => {
            next();
        });
    }, requireUserAuth);

    /**
     * Set common locals
     */
    router.use(async (req, res, next) => {
        res.locals.setSessionData = (dataPath, value) => set(req.session, `${sessionKeys.form}.${dataPath}`, value);
        res.locals.getSessionData = dataPath => get(`${sessionKeys.form}.${dataPath}`)(req.session);
        res.locals.clearSession = () => delete req.session[sessionKeys.form];

        const currentEditingId = res.locals.getSessionData(sessionKeys.editingId);

        res.locals.currentlyEditingId = currentEditingId;

        // Look up the current application data
        const application = currentEditingId
            ? await applicationsService.getApplicationById(sessionKeys.form, currentEditingId)
            : {};

        const currentApplicationData = get('application_data')(application);
        res.locals.currentApplicationTitle = get('application_title')(application);
        res.locals.currentApplicationData = currentApplicationData;

        // Translate the form object for each request and populate it with current user input
        const form = enhanceForm(req.i18n.getLocale(), formModel, currentApplicationData);

        res.locals.form = form;
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
                const application = await applicationsService.createApplication({
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
            const fieldsForStep = flatMap(currentStep.fieldsets, 'fields');
            const fieldNamesForStep = fieldsForStep.map(field => field.name);

            function renderStep(req, res, data, errors = []) {
                const form = enhanceForm(req.i18n.getLocale(), formModel, data);

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
                        title: `${stepLocalised.title} | ${res.locals.form.title}`,
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
                    const errorsForStep = filterErrors(validationResult.error, fieldNamesForStep);
                    // const errorKeysForStep = errorsForStep.map(detail => detail.context.key);
                    const errorKeysForStep = errorsForStep.map(detail => detail.path[0]);

                    /**
                     * Prepare data for storage
                     * Exclude any values in the current submission which have errors
                     */
                    const newFormData = omit(validationResult.value, errorKeysForStep);

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
            res.locals.breadcrumbs = concat(res.locals.breadcrumbs, { label: 'Terms & Conditions' });

            res.locals.form = enhanceForm(req.i18n.getLocale(), formModel, res.locals.currentApplicationData);

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
