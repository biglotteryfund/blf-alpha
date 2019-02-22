'use strict';
const { cloneDeep, find, flatMap, isEmpty, set, concat, unset, pickBy, identity } = require('lodash');
const { get, getOr } = require('lodash/fp');
const { matchedData } = require('express-validator/filter');
const { validationResult } = require('express-validator/check');
const express = require('express');
const path = require('path');
const Raven = require('raven');

const cached = require('../../middleware/cached');
const { localify } = require('../../modules/urls');

function translateForm(formModel, locale, formData) {
    const localise = get(locale);

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

    const translateStep = step => {
        step.title = localise(step.title);

        // Translate each fieldset
        step.fieldsets = step.fieldsets.map(fieldset => {
            fieldset.legend = localise(fieldset.legend);
            fieldset.introduction = localise(fieldset.introduction);

            // Translate each field
            fieldset.fields = fieldset.fields.map(field => {
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
            });

            return fieldset;
        });

        return step;
    };

    const clonedForm = cloneDeep(formModel);
    clonedForm.title = localise(formModel.title);

    clonedForm.sections = clonedForm.sections.map(section => {
        section = translateSection(section);
        section.steps = section.steps.map(step => translateStep(step));
        return section;
    });

    return clonedForm;
}
const FORM_STATES = {
    incomplete: {
        type: 'INCOMPLETE',
        label: 'In progress'
    },
    complete: {
        type: 'COMPLETE',
        label: 'Complete'
    },
    invalid: {
        type: 'INVALID',
        label: 'Invalid'
    },
    empty: {
        type: 'EMPTY',
        label: 'Not started'
    }
};

function validateFormState(form, formErrors) {
    const clonedForm = cloneDeep(form);
    const invalidFieldNames = formErrors.map(e => e.param);

    clonedForm.sections.map(section => {
        // if a step has any errors, return and mark section as incomplete
        section.steps.forEach(step => {
            step.fieldsets.map(fieldset => {
                fieldset.fields.map(field => {
                    if (invalidFieldNames.indexOf(field.name) !== -1) {
                        // Is this field in the error array?
                        // (eg. it failed validation)
                        // @TODO should this just be marked as incomplete?
                        field.state = FORM_STATES.invalid;
                    } else {
                        // Otherwise, it must be valid
                        field.state = FORM_STATES.complete;
                    }
                    return field;
                });
                return fieldset;
            });

            // See if this step's fieldsets are all empty (as opposed to invalid)
            const stepIsEmpty = isEmpty(
                pickBy(
                    step.fieldsets.reduce((acc, fieldset) => {
                        return concat(fieldset.fields.map(f => f.value), acc);
                    }, []),
                    identity
                )
            );

            if (stepIsEmpty) {
                step.state = FORM_STATES.empty;
            } else {
                // Work out this step's state based on its fieldsets' state
                const stepHasInvalidFields = step.fieldsets.some(fieldset =>
                    fieldset.fields.some(field => field.state !== FORM_STATES.complete)
                );
                step.state = stepHasInvalidFields ? FORM_STATES.incomplete : FORM_STATES.complete;
            }

            return step;
        });

        // See if this section's steps are all empty
        const sectionIsNotEmpty = section.steps.some(step => step.state !== FORM_STATES.empty);

        if (sectionIsNotEmpty) {
            // Work out this section's state based on its steps' state
            const sectionHasInvalidSteps = section.steps.some(step => step.state !== FORM_STATES.complete);
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

const getSessionKey = formModel => `apply.${formModel.id}`;

const getAllFormFields = formModel => {
    let allFields = [];
    formModel.sections.forEach(section => {
        section.steps.forEach(step => {
            step.fieldsets.forEach(fieldset => {
                fieldset.fields.forEach(field => allFields.push(field));
            });
        });
    });
    return allFields;
};

function initFormRouter(formModel) {
    const router = express.Router();

    const getSession = getOr({}, formModel.sessionKey);
    const setSession = (session, data) => set(session, formModel.sessionKey, { ...getSession(session), ...data });

    router.use(cached.csrfProtection, (req, res, next) => {
        // Translate the form object for each request and populate it with session data
        const formData = getSession(req.session);
        res.locals.form = translateForm(formModel, req.i18n.getLocale(), formData);
        res.locals.formData = formData;
        res.locals.FORM_STATES = FORM_STATES;
        res.locals.formTitle = 'Application form: ' + res.locals.form.title;
        res.locals.isBilingual = formModel.isBilingual;
        res.locals.enablePrompt = false; // Disable prompts on apply pages
        res.locals.bodyClass = 'has-static-header'; // No hero images on apply pages
        res.locals.formBaseUrl = req.baseUrl;
        res.locals.breadcrumbs = [
            {
                label: res.locals.form.title,
                url: req.baseUrl
            }
        ];
        next();
    });

    /**
     * Route: Start page
     */
    router.get('/', cached.noCache, function(req, res) {
        const { startPage } = res.locals.form;
        if (!startPage) {
            throw new Error('No startpage found');
        }

        const firstSection = res.locals.form.sections[0];

        if (startPage.template) {
            res.render(startPage.template, {
                title: res.locals.form.title,
                startUrl: `${req.baseUrl}/${firstSection.slug}`
            });
        } else if (startPage.urlPath) {
            res.redirect(localify(req.i18n.getLocale())(startPage.urlPath));
        } else {
            throw new Error('No valid startpage types found');
        }
    });

    formModel.sections.forEach(sectionModel => {
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

            function redirectNext(req, res) {
                /**
                 * @TODO: Review this logic
                 * 1. If there a next step in the current section go there.
                 * 2. Otherwise go to summary screen
                 */
                if (nextStep) {
                    res.redirect(`${req.baseUrl}/${sectionModel.slug}/${currentStepNumber + 1}`);
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

                if (stepModel.matchesCondition && stepModel.matchesCondition(getSession(req.session)) === false) {
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

            function handleSubmitStep(req, res) {
                setSession(req.session, matchedData(req, { locations: ['body'] }));
                req.session.save(() => {
                    const errors = validationResult(req);
                    if (errors.isEmpty()) {
                        redirectNext(req, res);
                    } else {
                        renderStep(req, res, errors.array());
                    }
                });
            }

            const fieldsForStep = flatMap(stepModel.fieldsets, 'fields');
            const validators = fieldsForStep.map(field => field.validator(field));

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
            returnUrl: `${req.baseUrl}/review`
        });
    }

    /**
     * Route: Summary
     */
    const validateAllFields = getAllFormFields(formModel).map(f => f.validator(f));
    router
        .route('/summary')
        .get(function(req, res) {
            res.locals.breadcrumbs = concat(res.locals.breadcrumbs, {
                label: 'Summary'
            });
            res.render(path.resolve(__dirname, './views/summary'), {
                form: res.locals.form,
                csrfToken: req.csrfToken()
            });
        })
        .post(
            (req, res, next) => {
                // Fake a post body so the validators can run as if
                // the entire form was submitted in one go
                req.body = res.locals.formData;
                next();
            },
            validateAllFields,
            async function(req, res) {
                const errors = validationResult(req);
                if (errors.isEmpty()) {
                    try {
                        await formModel.processor({
                            form: res.locals.form,
                            data: res.locals.formData
                        });
                        res.redirect(`${req.baseUrl}/success`);
                    } catch (error) {
                        Raven.captureException(error);
                        renderError(error, req, res);
                    }
                } else {
                    res.locals.breadcrumbs = concat(res.locals.breadcrumbs, {
                        label: 'Summary'
                    });
                    res.render(path.resolve(__dirname, './views/summary'), {
                        form: validateFormState(res.locals.form, errors.array()),
                        csrfToken: req.csrfToken()
                    });
                }
            }
        );

    /**
     * Route: Success
     */
    router.get('/success', cached.noCache, function(req, res) {
        const stepConfig = formModel.successStep;
        const stepCopy = get(res.locals.copy, 'success', {});

        if (isEmpty(res.locals.formData)) {
            res.redirect(req.baseUrl);
        } else {
            // Clear the submission from the session on success
            unset(req.session, formModel.sessionKey);
            req.session.save(() => {
                res.render(stepConfig.template, {
                    form: res.locals.form,
                    title: stepCopy.title,
                    stepCopy: stepCopy,
                    stepConfig: stepConfig
                });
            });
        }
    });

    return router;
}

module.exports = {
    initFormRouter
};
