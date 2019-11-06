'use strict';
const express = require('express');
const path = require('path');

const commonLogger = require('../../../common/logger');
const { injectCopy } = require('../../../common/inject-content');

const logger = commonLogger.child({
    service: 'apply'
});

module.exports = function(eligibilityBuilder, formId) {
    const router = express.Router();

    const templatePath = path.resolve(__dirname, './views/eligibility');

    function renderPending(req, res, errors = []) {
        const { currentStepNumber } = res.locals;

        const backUrl =
            currentStepNumber === 1
                ? res.locals.sectionUrl
                : `${req.baseUrl}/${currentStepNumber - 1}`;

        res.render(templatePath, {
            csrfToken: req.csrfToken(),
            eligibilityStatus: 'pending',
            backUrl: backUrl,
            errors: errors
        });
    }

    router
        .route('/:step?')
        .all(injectCopy('applyNext'), function(req, res, next) {
            const eligibility = eligibilityBuilder({
                locale: req.i18n.getLocale()
            });

            res.locals.title = res.locals.copy.eligibility.title;
            res.locals.eligibility = eligibility;

            const currentStepNumber = parseInt(req.params.step);
            const currentStep = eligibility.questions[currentStepNumber - 1];

            if (currentStep) {
                res.locals.currentStep = currentStep;
                res.locals.currentStepNumber = currentStepNumber;
                res.locals.totalSteps = eligibility.questions.length;
                next();
            } else {
                return res.redirect(`${req.baseUrl}/1`);
            }
        })
        .get(function(req, res) {
            renderPending(req, res);
        })
        .post(async function(req, res) {
            const { currentStep, currentStepNumber, totalSteps } = res.locals;

            if (req.body.eligibility === 'yes') {
                if (currentStepNumber === totalSteps) {
                    logger.info('Passed eligibility check', { formId });

                    res.render(templatePath, {
                        eligibilityStatus: 'eligible'
                    });
                } else {
                    res.redirect(`${req.baseUrl}/${currentStepNumber + 1}`);
                }
            } else if (req.body.eligibility === 'no') {
                logger.info('Failed eligibility check', {
                    formId: formId,
                    step: currentStepNumber
                });

                res.render(templatePath, {
                    eligibilityStatus: 'ineligible',
                    backUrl: `${req.baseUrl}/${currentStepNumber}`,
                    hotJarTagList: [
                        'Apply: AFA: Failed eligibility check question'
                    ]
                });
            } else {
                renderPending(req, res, [
                    {
                        param: 'eligibility',
                        msg: res.locals.copy.eligibility.invalidChoice,
                        field: {
                            label: currentStep.question
                        }
                    }
                ]);
            }
        });

    return router;
};
