'use strict';
const Raven = require('raven');
const { get, isEmpty, set, unset } = require('lodash');
const { validationResult } = require('express-validator/check');
const { matchedData } = require('express-validator/filter');
const cached = require('../../middleware/cached');

function createFormRouter(router, formModel) {
    const formSteps = formModel.getSteps();
    const totalSteps = formSteps.length + 1; // allow for the review 'step"

    function getFormSession(req, step) {
        return get(req.session, formModel.getSessionProp(step), {});
    }

    formSteps.forEach((step, idx) => {
        const currentStepNumber = idx + 1;
        const nextStepNumber = currentStepNumber + 1;
        const prevStepNumber = currentStepNumber - 1;

        function nextStepUrl(baseUrl) {
            if (currentStepNumber === formSteps.length) {
                return `${baseUrl}/review`;
            } else {
                return `${baseUrl}/${nextStepNumber}`;
            }
        }

        function prevStepUrl(baseUrl) {
            if (currentStepNumber > 1) {
                return `${baseUrl}/${currentStepNumber - 1}`;
            } else {
                return baseUrl;
            }
        }

        function renderStep(req, res, errors = []) {
            const stepData = getFormSession(req, currentStepNumber);
            res.render('pages/apply/form', {
                csrfToken: req.csrfToken(),
                form: formModel,
                step: step.withValues(stepData),
                prevStepUrl: prevStepUrl(req.baseUrl),
                currentStepNumber: currentStepNumber,
                totalSteps: totalSteps,
                errors: errors
            });
        }

        router
            .route(`/${currentStepNumber}`)
            .all(cached.csrfProtection)
            .get(function(req, res) {
                if (currentStepNumber > 1) {
                    const previousStepData = getFormSession(req, prevStepNumber);
                    if (isEmpty(previousStepData)) {
                        res.redirect(req.baseUrl);
                    } else {
                        renderStep(req, res);
                    }
                } else {
                    renderStep(req, res);
                }
            })
            .post(step.getValidators(), function(req, res) {
                // Save valid fields and merge with any existing data (if we are editing the step);
                const sessionProp = formModel.getSessionProp(currentStepNumber);
                const stepData = get(req.session, sessionProp, {});
                const bodyData = matchedData(req, { locations: ['body'] });
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

    router
        .route('/review')
        .all(cached.csrfProtection)
        .get(function(req, res) {
            const formData = getFormSession(req);
            if (isEmpty(formData)) {
                res.redirect(req.baseUrl);
            } else {
                res.render('pages/apply/review', {
                    csrfToken: req.csrfToken(),
                    form: formModel,
                    stepConfig: formModel.getReviewStep(),
                    currentStepNumber: totalSteps,
                    totalSteps: totalSteps,
                    summary: formModel.getStepsWithValues(formData),
                    baseUrl: req.baseUrl
                });
            }
        })
        .post(function(req, res) {
            const formData = getFormSession(req);
            const successStep = formModel.getSuccessStep();
            const errorStep = formModel.getErrorStep();

            if (isEmpty(formData)) {
                res.redirect(req.baseUrl);
            } else {
                successStep
                    .processor(formData)
                    .then(() => {
                        res.redirect(`${req.baseUrl}/success`);
                    })
                    .catch(err => {
                        Raven.captureException(err);
                        res.render('pages/apply/error', {
                            form: formModel,
                            stepConfig: errorStep,
                            returnUrl: `${req.baseUrl}/review`
                        });
                    });
            }
        });

    router.get('/success', cached.noCache, function(req, res) {
        const formData = getFormSession(req);
        const successStep = formModel.getSuccessStep();

        if (isEmpty(formData)) {
            res.redirect(req.baseUrl);
        } else {
            // Clear the submission from the session on success
            unset(req.session, formModel.getSessionProp());
            req.session.save(() => {
                res.render('pages/apply/success', {
                    form: formModel,
                    stepConfig: successStep
                });
            });
        }
    });

    return router;
}

module.exports = {
    createFormRouter
};
