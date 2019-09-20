'use strict';
const path = require('path');
const csurf = require('csurf');
const express = require('express');
const findIndex = require('lodash/findIndex');

const { noStore } = require('../../../common/cached');
const { injectCopy } = require('../../../common/inject-content');
const { sanitiseRequestBody } = require('../../../common/sanitise');

const formBuilder = require('./form');

const router = express.Router();

router.use(
    noStore,
    injectCopy('applyNext'),
    function setCommonLocals(req, res, next) {
        const form = formBuilder({
            locale: req.i18n.getLocale()
        });

        res.locals.formTitle = form.title;
        res.locals.formBaseUrl = req.baseUrl;

        res.locals.user = req.user;
        res.locals.isBilingual = true;
        res.locals.enableSiteSurvey = false;
        res.locals.bodyClass = 'has-static-header';

        next();
    },
    csurf()
);

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

        if (!section) {
            res.redirect(res.locals.formBaseUrl);
        }

        const sectionUrl = `${res.locals.formBaseUrl}/${section.slug}`;

        if (!stepNumber) {
            res.redirect(`${sectionUrl}/1`);
        }

        const stepIndex = parseInt(stepNumber, 10) - 1;
        const step = section.steps[stepIndex];

        if (!step) {
            res.redirect(res.locals.formBaseUrl);
        }

        const { nextPage, previousPage } = form.pagination({
            baseUrl: res.locals.formBaseUrl,
            sectionSlug: req.params.section,
            currentStepIndex: stepIndex,
            copy: res.locals.copy
        });

        if (step.isRequired) {
            const viewData = {
                csrfToken: req.csrfToken(),
                section: section,
                step: step,
                stepNumber: stepNumber,
                totalSteps: section.steps.length,
                previousPage: previousPage,
                nextPage: nextPage,
                errors: errors
            };

            res.render(
                path.resolve(__dirname, '../form-router-next/views/step'),
                viewData
            );
        } else {
            res.redirect(nextPage.url);
        }
    };
}

router
    .route('/:section/:step?')
    .get((req, res) => {
        const renderStep = renderStepFor(req.params.section, req.params.step);
        renderStep(req, res, res.locals.currentApplicationData);
    })
    .post(async (req, res) => {
        const sanitisedBody = sanitiseRequestBody(req.body);

        const form = formBuilder({
            locale: req.i18n.getLocale(),
            data: sanitisedBody
        });

        const stepIndex = parseInt(req.params.step, 10) - 1;

        const errorsForStep = form.getErrorsForStep(
            req.params.section,
            stepIndex
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

            renderStep(req, res, form.validation.value, errorsForStep);
        } else {
            const { nextPage } = form.pagination({
                baseUrl: res.locals.formBaseUrl,
                sectionSlug: req.params.section,
                currentStepIndex: stepIndex,
                copy: res.locals.copy
            });
            res.redirect(nextPage.url);
        }
    });

module.exports = router;
