'use strict';
const express = require('express');
const router = express.Router();
const { get, set } = require('lodash');
const { validationResult } = require('express-validator/check');
const { matchedData } = require('express-validator/filter');

const formModel = require('./example-form');

const formSteps = formModel.getSteps();
formSteps.forEach((step, idx) => {
    const currentStepIdx = idx;
    const currentStepNumber = currentStepIdx + 1;
    const nextStepNumber = currentStepNumber + 1;
    const nextStepUrl = baseUrl => {
        if (currentStepNumber === formSteps.length) {
            return `${baseUrl}/success`;
        } else {
            return `${baseUrl}/${nextStepNumber}`;
        }
    };
    const prevStepUrl = baseUrl => {
        if (currentStepNumber === 2) {
            return baseUrl;
        }
        if (currentStepNumber > 2) {
            return `${baseUrl}/${currentStepNumber - 1}`;
        }
    };

    const sessionProp = `form.${formModel.id}.step-${currentStepNumber}`;

    function renderStep(req, res, errors = []) {
        const stepData = get(req.session, sessionProp, {});
        res.render('pages/form-experiments', {
            form: formModel,
            step: step.withValues(stepData),
            prevStepUrl: prevStepUrl(req.baseUrl),
            currentStepNumber: currentStepNumber,
            totalSteps: formSteps.length,
            errors: errors,
            errorsForField: function(field) {
                return errors.filter(error => error.param === field.name);
            }
        });
    }

    router
        .route(currentStepNumber === 1 ? '/' : `/${currentStepNumber}`)
        .get(function(req, res) {
            renderStep(req, res);
        })
        .post(step.getValidators(), function(req, res) {
            // Save valid fields and merge with any existing data (if we are editing the step);
            const bodyData = matchedData(req, { locations: ['body'] });
            const stepData = get(req.session, sessionProp, {});
            set(req.session, sessionProp, Object.assign(stepData, bodyData));

            req.session.save(() => {
                const errors = validationResult(req);
                if (!errors.isEmpty()) {
                    return renderStep(req, res, errors.array());
                }

                res.redirect(nextStepUrl(req.baseUrl));
            });
        });
});

const successStep = formModel.getSuccessStep();
router.get('/success', function(req, res) {
    res.send([successStep, req.session]);
});

module.exports = router;
