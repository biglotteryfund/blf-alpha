'use strict';
const { flatMap } = require('lodash');
const { matchedData } = require('express-validator/filter');
const { check, validationResult } = require('express-validator/check');
const express = require('express');
const path = require('path');

const cached = require('../../middleware/cached');

function initFormRouter(form) {
    const router = express.Router();

    router.use((req, res, next) => {
        res.locals.formTitle = form.title;
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
                res.render(path.resolve(__dirname, './views/step'), {
                    csrfToken: req.csrfToken(),
                    step: step,
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
                         * 3. Otherwise go to review
                         */
                        const nextStep = section.steps[stepIndex + 1];
                        const nextSection = form.sections[sectionIndex + 1];

                        if (nextStep) {
                            res.redirect(`${req.baseUrl}/${section.slug}/${currentStepNumber + 1}`);
                        } else if (nextSection) {
                            res.redirect(`${req.baseUrl}/${nextSection.slug}`);
                        } else {
                            res.redirect(`${req.baseUrl}/review`);
                        }
                    } else {
                        renderStep(req, res, errors.array());
                    }
                };
            }

            router
                .route(`/${section.slug}/${currentStepNumber}`)
                .all(cached.csrfProtection)
                .get(renderStepIfAllowed)
                .post(getValidators(step), handleSubmitStep());
        });
    });

    return router;
}

module.exports = {
    initFormRouter
};
