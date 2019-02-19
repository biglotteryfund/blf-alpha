'use strict';
const { cloneDeep, find, flatMap, get, isEmpty, set } = require('lodash');
const { matchedData } = require('express-validator/filter');
const { check, validationResult } = require('express-validator/check');
const express = require('express');
const path = require('path');

const cached = require('../../middleware/cached');

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

function formWithValues(formModel, formData) {
    const clonedForm = cloneDeep(formModel);
    clonedForm.sections = clonedForm.sections.map(section => {
        section.steps = section.steps.map(step => stepWithValues(step, formData));
        return section;
    });
    return clonedForm;
}

function initFormRouter(form) {
    const router = express.Router();

    const getSessionData = session => get(session, `apply.${form.id}`, {});

    const setSessionData = (session, newData) => {
        const formData = getSessionData(session);
        set(session, `apply.${form.id}`, Object.assign(formData, newData));
    };

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
                const formData = getSessionData(req.session);
                res.render(path.resolve(__dirname, './views/step'), {
                    csrfToken: req.csrfToken(),
                    step: stepWithValues(step, formData),
                    errors: errors
                });
            }

            function handleSubmitStep(req, res) {
                setSessionData(req.session, matchedData(req, { locations: ['body'] }));
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

            const fieldsForStep = flatMap(step.fieldsets, 'fields');
            const validators = fieldsForStep.map(getFieldValidator);

            router
                .route(`/${section.slug}/${currentStepNumber}`)
                .get((req, res) => renderStep(req, res))
                .post(validators, handleSubmitStep);
        });
    });

    /**
     * Summary
     */
    router.route('/summary').get(function(req, res) {
        const formData = getSessionData(req.session);
        if (isEmpty(formData)) {
            res.redirect(req.baseUrl);
        } else {
            res.render(path.resolve(__dirname, './views/summary'), {
                form: formWithValues(form, formData),
                csrfToken: req.csrfToken()
            });
        }
    });

    return router;
}

module.exports = {
    initFormRouter
};
