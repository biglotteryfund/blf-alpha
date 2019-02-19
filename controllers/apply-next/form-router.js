'use strict';
const { flatMap, cloneDeep, get } = require('lodash');
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

function initFormRouter(form) {
    const router = express.Router();

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
                res.render(path.resolve(__dirname, './views/step'), {
                    title: `${stepLocalised.title} | ${res.locals.formTitle}`,
                    csrfToken: req.csrfToken(),
                    step: stepLocalised,
                    errors: errors
                });
            }

            function renderStepIfAllowed(req, res) {
                // @TODO: Logic for when to render step
                renderStep(req, res);
            }

            function handleSubmitStep() {
                return function(req, res) {
                    // const bodyData = matchedData(req, { locations: ['body'] });
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
                };
            }

            router
                .route(`/${sectionModel.slug}/${currentStepNumber}`)
                .get(renderStepIfAllowed)
                // @TODO translate validators
                .post(getValidators(sectionModel), handleSubmitStep());
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
