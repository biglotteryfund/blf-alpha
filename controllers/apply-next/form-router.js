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

function translateForm(locale, formModel, formData) {
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

    const clonedForm = cloneDeep(formModel);
    clonedForm.title = localise(formModel.title);

    clonedForm.sections = clonedForm.sections.map(section => {
        section = translateSection(section);
        section.steps = section.steps.map(step => translateStep(step));
        return section;
    });

    if (clonedForm.termsFields) {
        clonedForm.termsFields = clonedForm.termsFields.map(translateField);
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

// @TODO flatmap some of this?
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
    const validationSessionKey = `validation.${formModel.sessionKey}`;

    router.use(cached.csrfProtection, (req, res, next) => {
        // Translate the form object for each request and populate it with session data
        res.locals.form = translateForm(req.i18n.getLocale(), formModel, getSession(req.session));
        res.locals.validation = get(validationSessionKey)(req.session);
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
                    const validationPath = `${validationSessionKey}.${sectionModel.slug}.step-${stepIndex}]`;
                    const errors = validationResult(req);
                    if (errors.isEmpty()) {
                        // If a step has no errors, then mark it as valid
                        set(req.session, validationPath, FORM_STATES.complete);
                        req.session.save(() => {
                            redirectNext(req, res);
                        });
                    } else {
                        // Remove this step from the valid list (if it was there before)
                        unset(req.session, validationPath);
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
    const validateAllFields = getAllFormFields(formModel).map(f => f.validator(f));

    const injectFormBody = (req, res, next) => {
        // Fake a post body so the validators can run as if
        // the entire form was submitted in one go
        req.body = getSession(req.session);
        next();
    };

    router
        .route('/summary')
        .get(function(req, res) {
            const formData = getSession(req.session);

            res.locals.breadcrumbs = concat(res.locals.breadcrumbs, {
                label: 'Summary'
            });
            res.render(path.resolve(__dirname, './views/summary'), {
                form: validateFormState(res.locals.form, formData, res.locals.validation),
                csrfToken: req.csrfToken()
            });
        })
        .post(injectFormBody, validateAllFields, async function(req, res) {
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
            const formData = getSession(req.session);
            const validatedForm = validateFormState(res.locals.form, formData, res.locals.validation);
            if (validatedForm.state.type !== 'complete') {
                res.redirect(`${req.baseUrl}/summary`);
            } else {
                next();
            }
        })
        .get(function(req, res) {
            res.locals.breadcrumbs = concat(res.locals.breadcrumbs, {
                label: 'Terms & Conditions'
            });
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
                        data: getSession(req.session)
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
    router.get('/success', cached.noCache, function(req, res) {
        const stepConfig = formModel.successStep;
        const formData = getSession(req.session);
        if (isEmpty(formData)) {
            res.redirect(req.baseUrl);
        } else {
            // Clear the submission from the session on success
            unset(req.session, formModel.sessionKey);
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
