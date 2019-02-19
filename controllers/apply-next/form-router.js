'use strict';
const { cloneDeep, find, flatMap, get, set } = require('lodash');
const { matchedData } = require('express-validator/filter');
const { check, validationResult } = require('express-validator/check');
const express = require('express');
const path = require('path');

const cached = require('../../middleware/cached');

const translateField = (field, locale) => {
    return get(field, locale);
};

// @TODO this does not translate nested fields – should it?
const translateSection = (section, locale) => {
    section.title = translateField(section.title, locale);
    if (section.summary) {
        section.summary = translateField(section.summary, locale);
    }
    return section;
};

const translateStep = (step, locale) => {
    step.title = translateField(step.title, locale);

    // Translate each fieldset
    step.fieldsets = step.fieldsets.map(fieldset => {
        fieldset.legend = translateField(fieldset.legend, locale);
        // Translate each field
        fieldset.fields = fieldset.fields.map(field => {
            field.label = translateField(field.label, locale);
            field.explanation = translateField(field.explanation, locale);

            // Translate each option (if set)
            if (field.options) {
                field.options = field.options.map(option => {
                    option.label = translateField(option.label, locale);
                    return option;
                });
            }
            return field;
        });

        return fieldset;
    });

    return step;
};

function getSessionPropFor(formId) {
    return function(section, stepNumber) {
        const baseProp = `apply.${formId}`;
        if (section && stepNumber) {
            return `${baseProp}.${section}.step-${stepNumber}`;
        } else if (section) {
            return `${baseProp}.${section}`;
        } else {
            return baseProp;
        }
    };
}

function getFieldValidator(field) {
    if (field.validator) {
        return field.validator(field);
    } else if (field.isRequired === true) {
        return check(field.name)
            .trim()
            .not()
            .isEmpty()
            .withMessage('Field must be provided');
    } else {
        return check(field.name)
            .trim()
            .optional();
    }
}

function stepWithValues(step, values) {
    const clonedStep = cloneDeep(step);
    clonedStep.fieldsets = clonedStep.fieldsets.map(fieldset => {
        fieldset.fields = fieldset.fields.map(field => {
            const match = find(values, (value, name) => name === field.name);
            if (match) {
                field.value = match;
            }
            return field;
        });
        return fieldset;
    });
    return clonedStep;
}

function initFormRouter(form) {
    const router = express.Router();

    const getSessionProp = getSessionPropFor(form.id);

    router.use(cached.csrfProtection, (req, res, next) => {
        res.locals.formTitle = translateField(form.title, req.i18n.getLocale());
        res.locals.isBilingual = form.isBilingual;
        res.locals.enablePrompt = false; // Disable prompts on apply pages
        res.locals.bodyClass = 'has-static-header'; // No hero images on apply pages
        next();
    });

    /**
     * Collect all validators associated with each field for express-validator
     */
    function getValidators(step) {
        const fields = flatMap(step.fieldsets, 'fields');
        return fields.map(field => {
            if (field.validator) {
                // @TODO: Pass form data into this function
                return field.validator(field);
            } else if (field.isRequired === true) {
                return check(field.name)
                    .trim()
                    .not()
                    .isEmpty()
                    .withMessage('Field must be provided');
            } else {
                return check(field.name)
                    .trim()
                    .optional();
            }
        });
    }

    form.sections.forEach((sectionModel, sectionIndex) => {
        router.get(`/${sectionModel.slug}`, (req, res) => {
            const locale = req.i18n.getLocale();
            const sectionLocalised = translateSection(cloneDeep(sectionModel), locale);
            if (sectionLocalised.summary) {
                res.render(path.resolve(__dirname, './views/section-summary'), {
                    title: `${sectionLocalised.title} | ${res.locals.formTitle}`,
                    section: sectionLocalised,
                    backUrl: null, // @TODO: Determine backUrl
                    nextUrl: `${req.baseUrl}/${sectionModel.slug}/1`
                });
            } else {
                res.redirect(`${req.baseUrl}/${sectionModel.slug}/1`);
            }
        });

        sectionModel.steps.forEach((stepModel, stepIndex) => {
            const currentStepNumber = stepIndex + 1;

            function renderStep(req, res, errors = []) {
                const stepLocalised = translateStep(cloneDeep(stepModel), req.i18n.getLocale());
                const stepData = get(req.session, getSessionProp(sectionModel.id, stepIndex));
                res.render(path.resolve(__dirname, './views/step'), {
                    title: `${stepLocalised.title} | ${res.locals.formTitle}`,
                    csrfToken: req.csrfToken(),
                    step: stepWithValues(stepLocalised, stepData),
                    errors: errors
                });
            }

            function handleSubmitStep(req, res) {
                const sessionProp = getSessionProp(sectionModel.id, stepIndex);
                const stepData = get(req.session, sessionProp, {});
                const bodyData = matchedData(req, { locations: ['body'] });
                set(req.session, sessionProp, Object.assign(stepData, bodyData));

                req.session.save(() => {
                    const errors = validationResult(req);
                    if (errors.isEmpty()) {
                        /**
                         * @TODO: Review this logic
                         * 1. Is there a next step go there.
                         * 2. If there is a next section go there.
                         * 3. Otherwise go to summary screen
                         */
                        const nextStep = sectionModel.steps[stepIndex + 1];
                        const nextSection = form.sections[sectionIndex + 1];

                        if (nextStep) {
                            res.redirect(`${req.baseUrl}/${sectionModel.slug}/${currentStepNumber + 1}`);
                        } else if (nextSection) {
                            res.redirect(`${req.baseUrl}/${nextSection.slug}`);
                        } else {
                            res.redirect(`${req.baseUrl}/summary`);
                        }
                    } else {
                        renderStep(req, res, errors.array());
                    }
                });
            }

            const fieldsForStep = flatMap(stepModel.fieldsets, 'fields');
            const validators = fieldsForStep.map(getFieldValidator);

            router
                .route(`/${sectionModel.slug}/${currentStepNumber}`)
                .get((req, res) => renderStep(req, res))
                // @TODO translate validators
                .post(validators, handleSubmitStep);
        });
    });

    /**
     * Summary
     */
    router.route('/summary').get(function(req, res) {
        res.render(path.resolve(__dirname, './views/summary'), {
            form: form,
            csrfToken: req.csrfToken()
        });
    });

    return router;
}

module.exports = {
    initFormRouter
};
