'use strict';
const { cloneDeep, concat, find, flatMap, isEmpty, pick, set, unset } = require('lodash');
const { get, getOr } = require('lodash/fp');
const { matchedData } = require('express-validator/filter');
const { validationResult } = require('express-validator/check');
const express = require('express');
const path = require('path');
const Raven = require('raven');

const cached = require('../../middleware/cached');
const { requireUserAuth } = require('../../middleware/authed');
const ApplicationService = require('../../services/applications');
const { localify } = require('../../modules/urls');

function prepareForm(locale, formModel, formData) {
    const localise = get(locale);

    const translateField = field => {
        field.label = localise(field.label);
        field.explanation = localise(field.explanation);

        const match = find(formData, (value, name) => name === field.name);
        if (match) {
            field.value = match;
        }

        // Translate each option (if set)
        if (field.options) {
            field.options = field.options.map(option => {
                option.label = localise(option.label);
                option.explanation = localise(option.explanation);
                return option;
            });
        }
        return field;
    };

    const translateStep = step => {
        step.title = localise(step.title);

        step.fieldsets = step.fieldsets.map(fieldset => {
            fieldset.legend = localise(fieldset.legend);
            fieldset.introduction = localise(fieldset.introduction);
            fieldset.fields = fieldset.fields.map(translateField);
            return fieldset;
        });

        return step;
    };

    const translateSection = section => {
        section.title = localise(section.title);
        if (section.summary) {
            section.summary = localise(section.summary);
        }
        if (section.introduction) {
            section.introduction = localise(section.introduction);
        }
        return section;
    };

    const clonedForm = cloneDeep(formModel);
    clonedForm.title = localise(formModel.title);

    clonedForm.sections = clonedForm.sections.map(section => {
        section = translateSection(section);
        section.steps = section.steps.map(translateStep);
        return section;
    });

    if (clonedForm.termsFields) {
        clonedForm.termsFields = clonedForm.termsFields.map(translateField);
    }

    if (clonedForm.titleField) {
        clonedForm.titleField = translateField(clonedForm.titleField);
    }

    return clonedForm;
}

const FORM_STATES = {
    incomplete: {
        type: 'incomplete',
        label: 'In progress'
    },
    complete: {
        type: 'complete',
        label: 'Complete'
    },
    invalid: {
        type: 'invalid',
        label: 'Invalid'
    },
    empty: {
        type: 'empty',
        label: 'Not started'
    }
};

function getFieldsForStep(step) {
    return flatMap(step.fieldsets, fieldset => fieldset.fields);
}

function getFieldsForSection(section) {
    return flatMap(section.steps, getFieldsForStep);
}

function getAllFields(formModel) {
    return flatMap(formModel.sections, getFieldsForSection);
}

/**
 * Build up a set of state parameters for steps, sections, and the form itself
 * eg. to show status on the summary page
 */
function validateFormState(form, formData, sessionValidation) {
    const clonedForm = cloneDeep(form);

    clonedForm.sections = clonedForm.sections.map(section => {
        section.steps = section.steps.map((step, stepIndex) => {
            // Handle steps that this user doesn't need to complete
            if (step.matchesCondition && step.matchesCondition(formData) === false) {
                step.state = FORM_STATES.complete;
                step.notRequired = true;
            } else {
                const fieldsForStep = getFieldsForStep(step);
                const stepData = pick(formData, fieldsForStep.map(field => field.name));

                if (isEmpty(stepData)) {
                    step.state = FORM_STATES.empty;
                } else {
                    // @TODO construct this via a function
                    const stepIsValid = getOr(false, `${section.slug}.step-${stepIndex}`)(sessionValidation);
                    step.state = stepIsValid ? FORM_STATES.complete : FORM_STATES.incomplete;
                }
            }

            return step;
        });

        // See if this section's steps are all empty
        const sectionIsNotEmpty = section.steps
            .filter(step => !step.notRequired)
            .some(step => step.state !== FORM_STATES.empty);

        if (sectionIsNotEmpty) {
            // Work out this section's state based on its steps' state
            const sectionHasInvalidSteps = section.steps
                .filter(step => step.notRequired === undefined)
                .some(step => step.state !== FORM_STATES.complete);
            section.state = sectionHasInvalidSteps ? FORM_STATES.incomplete : FORM_STATES.complete;
        } else {
            section.state = FORM_STATES.empty;
        }

        return section;
    });

    // Check whether the entire form is empty
    const formIsNotEmpty = clonedForm.sections.some(section => section.state !== FORM_STATES.empty);

    if (formIsNotEmpty) {
        // Work out the entire form's state based on its sections' state
        const formHasInvalidSections = clonedForm.sections.some(section => section.state !== FORM_STATES.complete);
        clonedForm.state = formHasInvalidSections ? FORM_STATES.incomplete : FORM_STATES.complete;
    } else {
        clonedForm.state = FORM_STATES.empty;
    }
    return clonedForm;
}

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
        /**
         * Route: Form sections
         */
        router.get(`/${sectionModel.slug}`, (req, res) => {
            const sectionLocalised = res.locals.form.sections.find(s => s.slug === sectionModel.slug);
            if (sectionLocalised.summary) {
                res.locals.breadcrumbs = concat(res.locals.breadcrumbs, {
                    label: sectionLocalised.title
                });
                res.render(path.resolve(__dirname, './views/section-summary'), {
                    title: `${sectionLocalised.title} | ${res.locals.form.title}`,
                    section: sectionLocalised,
                    backUrl: null, // @TODO: Determine backUrl
                    nextUrl: `${req.baseUrl}/${sectionModel.slug}/1`
                });
            } else {
                res.redirect(`${req.baseUrl}/${sectionModel.slug}/1`);
            }
        });

        /**
         * Route: Section steps
         */
        sectionModel.steps.forEach((stepModel, stepIndex) => {
            const currentStepNumber = stepIndex + 1;
            const numSteps = sectionModel.steps.length;
            const nextStep = sectionModel.steps[stepIndex + 1];
            const nextSection = formModel.sections[sectionIndex + 1];

            const fieldsForStep = flatMap(stepModel.fieldsets, 'fields');
            const validators = fieldsForStep.map(field => field.validator(field));

            function redirectNext(req, res) {
                /**
                 * 1. If there a next step in the current section go there.
                 * 2. Otherwise, if there's a next section, go there
                 * 3. Otherwise, go to summary screen
                 */
                if (nextStep) {
                    res.redirect(`${req.baseUrl}/${sectionModel.slug}/${currentStepNumber + 1}`);
                } else if (nextSection) {
                    res.redirect(`${req.baseUrl}/${nextSection.slug}`);
                } else {
                    res.redirect(`${req.baseUrl}/summary`);
                }
            }

            function renderStep(req, res, errors = []) {
                const sectionLocalised = res.locals.form.sections.find(s => s.slug === sectionModel.slug);
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

                if (
                    stepModel.matchesCondition &&
                    stepModel.matchesCondition(res.locals.currentApplicationData) === false
                ) {
                    redirectNext(req, res);
                } else {
                    res.render(path.resolve(__dirname, './views/step'), {
                        title: `${stepLocalised.title} | ${res.locals.form.title}`,
                        csrfToken: req.csrfToken(),
                        step: stepLocalised,
                        errors: errors
                    });
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
                            redirectNext(req, res);
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
    const allFieldValidators = getAllFields(formModel).map(field => {
        return field.validator(field);
    });

    const injectFormBody = (req, res, next) => {
        // Fake a post body so the validators can run as if
        // the entire form was submitted in one go
        req.body = res.locals.currentApplicationData;
        next();
    };

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
        .post(injectFormBody, allFieldValidators, async function(req, res) {
            const errors = validationResult(req);
            if (errors.isEmpty()) {
                // send them to T&Cs
                res.redirect(`${req.baseUrl}/terms`);
            } else {
                // They failed validation so send them back to confirm what they're missing
                res.redirect(`${req.baseUrl}/summary`);
            }
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
