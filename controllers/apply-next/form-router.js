'use strict';
const { concat, flatMap, isEmpty, set, unset } = require('lodash');
const { get } = require('lodash/fp');
const { matchedData } = require('express-validator/filter');
const { validationResult } = require('express-validator/check');
const express = require('express');
const path = require('path');
const Raven = require('raven');

const cached = require('../../middleware/cached');
const { requireUserAuth } = require('../../middleware/authed');
const ApplicationService = require('../../services/applications');
const { localify } = require('../../modules/urls');
const { FORM_STATES, findNextMatchingStepIndex, prepareForm, validateFormState } = require('./helpers');

function initFormRouter(formModel) {
    const router = express.Router();

    const sessionKeys = {
        form: formModel.sessionKey,
        validation: 'validation',
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
        res.locals.unsetSessionData = dataPath => unset(req.session, `${sessionKeys.form}.${dataPath}`);
        res.locals.clearSession = () => delete req.session[sessionKeys.form];

        // Look up the current application data
        let applicationData = {};
        res.locals.currentlyEditingId = res.locals.getSessionData(sessionKeys.editingId);
        if (res.locals.currentlyEditingId) {
            applicationData = await ApplicationService.getApplicationById(
                sessionKeys.form,
                res.locals.currentlyEditingId
            );
        }
        res.locals.currentApplicationData = applicationData ? applicationData.application_data : false;

        // Translate the form object for each request and populate it with current user input
        res.locals.form = prepareForm(req.i18n.getLocale(), formModel, res.locals.currentApplicationData);

        // Share some useful form variables
        res.locals.validation = res.locals.getSessionData(sessionKeys.validation);
        res.locals.FORM_STATES = FORM_STATES;
        res.locals.user = req.user;

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
    router
        .route('/')
        .all((req, res, next) => {
            const { startPage } = res.locals.form;
            if (!startPage) {
                throw new Error('No startpage found');
            }
            if (!startPage.urlPath && !startPage.template) {
                throw new Error('No valid startpage types found');
            }
            next();
        })
        .get(cached.noCache, async function(req, res) {
            const { startPage } = res.locals.form;
            const applications = await ApplicationService.getApplicationsForUser(
                req.user.userData.id,
                sessionKeys.form
            );
            if (startPage.template) {
                res.render(startPage.template, {
                    title: res.locals.form.title,
                    applications: applications,
                    csrfToken: req.csrfToken()
                });
            } else if (startPage.urlPath) {
                res.redirect(localify(req.i18n.getLocale())(startPage.urlPath));
            }
        })
        .post(formModel.titleField.validator(formModel.titleField), (req, res) => {
            const errors = validationResult(req);
            if (errors.isEmpty()) {
                // create app and proceed!
                ApplicationService.createApplication({
                    userId: req.user.userData.id,
                    formId: sessionKeys.form,
                    title: req.body['application-title']
                })
                    .then(application => {
                        res.redirect(`${req.baseUrl}/edit/${application.id}`);
                    })
                    .catch(error => {
                        Raven.captureException(error);
                        return renderError(error, req, res);
                    });
            } else {
                const { startPage } = res.locals.form;
                res.render(startPage.template, {
                    title: res.locals.form.title,
                    csrfToken: req.csrfToken(),
                    errors: errors.array()
                });
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
            const validators = fieldsForStep.map(field => field.validator(field));

            function redirectNext(nextMatchingStepIndex, req, res) {
                if (nextMatchingStepIndex !== -1 && nextMatchingStepIndex <= sectionModel.steps.length) {
                    res.redirect(`${req.baseUrl}/${sectionModel.slug}/${nextMatchingStepIndex + 1}`);
                } else if (nextSection) {
                    res.redirect(`${req.baseUrl}/${nextSection.slug}`);
                } else {
                    res.redirect(`${req.baseUrl}/summary`);
                }
            }

            function renderStep(req, res, errors = []) {
                const { form, currentApplicationData } = res.locals;

                const sectionLocalised = form.sections.find(s => s.slug === sectionModel.slug);
                const stepLocalised = sectionLocalised.steps[stepIndex];

                res.locals.breadcrumbs = concat(
                    res.locals.breadcrumbs,
                    {
                        label: sectionLocalised.title,
                        url: `${req.baseUrl}/${sectionModel.slug}`
                    },
                    {
                        label: `${stepLocalised.title} (Step ${currentStepNumber} of ${numSteps})`
                    }
                );

                const nextMatchingStepIndex = findNextMatchingStepIndex({
                    steps: sectionModel.steps,
                    startIndex: stepIndex,
                    formData: currentApplicationData
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

            async function handleSubmitStep(req, res) {
                const newData = {
                    ...res.locals.currentApplicationData,
                    ...matchedData(req, { locations: ['body'] })
                };

                await ApplicationService.updateApplication(res.locals.currentlyEditingId, newData);

                req.session.save(() => {
                    const validationPath = `${sessionKeys.validation}.${sectionModel.slug}.step-${stepIndex}]`;
                    const errors = validationResult(req);
                    if (errors.isEmpty()) {
                        // If a step has no errors, then mark it as valid
                        res.locals.setSessionData(validationPath, FORM_STATES.complete);
                        req.session.save(() => {
                            const nextMatchingStepIndex = findNextMatchingStepIndex({
                                steps: sectionModel.steps,
                                startIndex: stepIndex + 1,
                                formData: res.locals.currentApplicationData
                            });
                            redirectNext(nextMatchingStepIndex, req, res);
                        });
                    } else {
                        // Remove this step from the valid list (if it was there before)
                        res.locals.unsetSessionData(validationPath);
                        renderStep(req, res, errors.array());
                    }
                });
            }

            router
                .route(`/${sectionModel.slug}/${currentStepNumber}`)
                .get((req, res) => renderStep(req, res))
                .post(validators, handleSubmitStep);
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
    router
        .route('/summary')
        .get(function(req, res) {
            res.locals.breadcrumbs = concat(res.locals.breadcrumbs, {
                label: 'Summary'
            });
            res.render(path.resolve(__dirname, './views/summary'), {
                form: validateFormState(res.locals.form, res.locals.currentApplicationData, res.locals.validation),
                csrfToken: req.csrfToken()
            });
        })
        .post(function(req, res) {
            // @TODO: Revisit whole-schema validation
            res.redirect(`${req.baseUrl}/terms`);
        });

    /**
     * Route: Terms and Conditions
     */
    router
        .route('/terms')
        .all((req, res, next) => {
            res.locals.breadcrumbs = concat(res.locals.breadcrumbs, {
                label: 'Terms & Conditions'
            });
            const validatedForm = validateFormState(
                res.locals.form,
                res.locals.currentApplicationData,
                res.locals.validation
            );
            if (validatedForm.state.type !== 'complete') {
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
        .post(formModel.termsFields.map(field => field.validator(field)), async (req, res) => {
            const errors = validationResult(req);
            if (errors.isEmpty()) {
                // Everything is good, submit the form
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
            } else {
                res.render(path.resolve(__dirname, './views/terms'), {
                    csrfToken: req.csrfToken(),
                    errors: errors.array()
                });
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
