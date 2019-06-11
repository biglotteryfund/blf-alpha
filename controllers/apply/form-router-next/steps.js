'use strict';
const path = require('path');
const express = require('express');
const concat = require('lodash/concat');
const findIndex = require('lodash/findIndex');

const { PendingApplication } = require('../../../db/models');

const pagination = require('./lib/pagination');
const validateForm = require('./lib/validate-form');

module.exports = function(formBuilder) {
    const router = express.Router();

    function renderStepFor(sectionSlug, stepNumber) {
        return function(req, res, data, errors = []) {
            const form = formBuilder({
                locale: req.i18n.getLocale(),
                data: data
            });

            const sectionIndex = findIndex(
                form.sections,
                s => s.slug === sectionSlug
            );

            const section = form.sections[sectionIndex];

            if (section) {
                const sectionShortTitle = section.shortTitle
                    ? section.shortTitle
                    : section.title;

                const sectionUrl = `${res.locals.formBaseUrl}/${section.slug}`;

                if (stepNumber) {
                    const stepIndex = parseInt(stepNumber, 10) - 1;
                    const step = section.steps[stepIndex];

                    if (step) {
                        const { nextUrl, previousUrl } = pagination({
                            baseUrl: res.locals.formBaseUrl,
                            sections: form.sections,
                            sectionSlug: req.params.section,
                            currentStepIndex: stepIndex
                        });

                        if (step.isRequired) {
                            const viewData = {
                                csrfToken: req.csrfToken(),
                                breadcrumbs: concat(
                                    res.locals.breadcrumbs,
                                    {
                                        label: sectionShortTitle,
                                        url: sectionUrl
                                    },
                                    { label: step.title }
                                ),
                                section: section,
                                step: step,
                                stepNumber: stepNumber,
                                totalSteps: section.steps.length,
                                previousUrl: previousUrl,
                                nextUrl: nextUrl,
                                errors: errors
                            };

                            res.render(
                                path.resolve(__dirname, './views/step'),
                                viewData
                            );
                        } else {
                            res.redirect(nextUrl);
                        }
                    } else {
                        res.redirect(res.locals.formBaseUrl);
                    }
                } else if (section.introduction) {
                    const { nextUrl, previousUrl } = pagination({
                        baseUrl: res.locals.formBaseUrl,
                        sections: form.sections,
                        sectionSlug: req.params.section
                    });

                    const viewData = {
                        section: section,
                        breadcrumbs: concat(res.locals.breadcrumbs, {
                            label: sectionShortTitle,
                            url: sectionUrl
                        }),
                        nextUrl: nextUrl,
                        previousUrl: previousUrl
                    };

                    res.render(
                        path.resolve(__dirname, './views/section-introduction'),
                        viewData
                    );
                } else {
                    res.redirect(`${sectionUrl}/1`);
                }
            } else {
                res.redirect(res.locals.formBaseUrl);
            }
        };
    }

    router
        .route('/:section/:step?')
        .get((req, res) => {
            const renderStep = renderStepFor(
                req.params.section,
                req.params.step
            );
            renderStep(req, res, res.locals.currentApplicationData);
        })
        .post(async (req, res, next) => {
            const { currentlyEditingId, currentApplicationData } = res.locals;
            const data = { ...currentApplicationData, ...req.body };

            const form = formBuilder({
                locale: req.i18n.getLocale(),
                data: data
            });

            const stepIndex = parseInt(req.params.step, 10) - 1;
            const stepFields = form.getCurrentFieldsForStep(
                req.params.section,
                stepIndex
            );

            const validationResult = validateForm(form, data);

            try {
                await PendingApplication.saveApplicationState(
                    currentlyEditingId,
                    validationResult.value
                );

                const errorsForStep = validationResult.messages.filter(item =>
                    stepFields.map(field => field.name).includes(item.param)
                );

                /**
                 * If there are errors re-render the step with errors
                 * - Pass the full data object from validationResult to the view. Including invalid values.
                 * Otherwise, find the next suitable step and redirect there.
                 */
                if (errorsForStep.length > 0) {
                    const renderStep = renderStepFor(
                        req.params.section,
                        req.params.step
                    );
                    renderStep(req, res, validationResult.value, errorsForStep);
                } else {
                    const { nextUrl } = pagination({
                        baseUrl: res.locals.formBaseUrl,
                        sections: form.sections,
                        sectionSlug: req.params.section,
                        currentStepIndex: stepIndex
                    });
                    res.redirect(nextUrl);
                }
            } catch (error) {
                next(error);
            }
        });

    return router;
};
