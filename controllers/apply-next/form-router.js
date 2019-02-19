'use strict';
const { cloneDeep, find, flatMap, get, set } = require('lodash');
const { matchedData } = require('express-validator/filter');
const { check, validationResult } = require('express-validator/check');
const express = require('express');
const path = require('path');

const cached = require('../../middleware/cached');

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

/**
 * Collect all validators associated with each field for express-validator
 */
function getValidators(step) {
    const fields = flatMap(step.fieldsets, 'fields');
    return fields.map(field => {
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
    });
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
        res.locals.formTitle = form.title;
        res.locals.isBilingual = form.isBilingual;
        res.locals.enablePrompt = false; // Disable prompts on apply pages
        res.locals.bodyClass = 'has-static-header'; // No hero images on apply pages
        next();
    });

    form.sections.forEach((section, sectionIndex) => {
        router.get(`/${section.slug}`, (req, res) => {
            if (section.summary) {
                res.render(path.resolve(__dirname, './views/section-summary'), {
                    title: `${section.title} | ${res.locals.formTitle}`,
                    section: section,
                    backUrl: null, // @TODO: Determine backUrl
                    nextUrl: `${req.baseUrl}/${section.slug}/1`
                });
            } else {
                res.redirect(`${req.baseUrl}/${section.slug}/1`);
            }
        });

        section.steps.forEach((step, stepIndex) => {
            const currentStepNumber = stepIndex + 1;

            function renderStep(req, res, errors = []) {
                const stepData = get(req.session, getSessionProp(section.id, stepIndex));

                res.render(path.resolve(__dirname, './views/step'), {
                    csrfToken: req.csrfToken(),
                    step: stepWithValues(step, stepData),
                    errors: errors
                });
            }

            function handleSubmitStep(req, res) {
                const sessionProp = getSessionProp(section.id, stepIndex);
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
                        const nextStep = section.steps[stepIndex + 1];
                        const nextSection = form.sections[sectionIndex + 1];

                        if (nextStep) {
                            res.redirect(`${req.baseUrl}/${section.slug}/${currentStepNumber + 1}`);
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

            router
                .route(`/${section.slug}/${currentStepNumber}`)
                .get((req, res) => renderStep(req, res))
                .post(getValidators(step), handleSubmitStep);
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
