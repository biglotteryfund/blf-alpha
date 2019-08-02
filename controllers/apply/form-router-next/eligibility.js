'use strict';
const express = require('express');
const path = require('path');

const commonLogger = require('../../../common/logger');
const { injectCopy } = require('../../../middleware/inject-content');

const logger = commonLogger.child({
    service: 'apply'
});

module.exports = function(eligibilityBuilder, formId) {
    const router = express.Router();

    const templatePath = path.resolve(__dirname, './views/eligibility');

    router
        .route('/:step?')
        .all(injectCopy('applyNext'), function(req, res, next) {
            const eligibility = eligibilityBuilder({
                locale: req.i18n.getLocale()
            });

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
            const { currentStepNumber, formBaseUrl } = res.locals;

            res.render(templatePath, {
                csrfToken: req.csrfToken(),
                eligibilityStatus: 'pending',
                backUrl:
                    currentStepNumber === 1
                        ? formBaseUrl
                        : `${req.baseUrl}/${currentStepNumber - 1}`
            });
        })
        .post(async (req, res) => {
            const { currentStepNumber, totalSteps } = res.locals;

            logger.info('Eligibility check', {
                eligible: req.body.eligibility,
                formId: formId,
                step: currentStepNumber
            });

            if (req.body.eligibility === 'yes') {
                if (currentStepNumber === totalSteps) {
                    res.render(templatePath, {
                        eligibilityStatus: 'eligible'
                    });
                } else {
                    res.redirect(`${req.baseUrl}/${currentStepNumber + 1}`);
                }
            } else {
                res.locals.hotJarTagList = [
                    'Apply: AFA: Failed eligibility check question'
                ];
                res.render(templatePath, {
                    eligibilityStatus: 'ineligible',
                    backUrl: `${req.baseUrl}/${currentStepNumber}`
                });
            }
        });

    return router;
};
