'use strict';
const Raven = require('raven');
const { get, isEmpty, set, unset } = require('lodash');
const { validationResult } = require('express-validator/check');
const { matchedData } = require('express-validator/filter');
const cached = require('../../middleware/cached');

function createFormRouter({ router, formModel }) {
    const formSteps = formModel.getSteps();
    const totalSteps = formSteps.length + 1; // allow for the review 'step"

    function getFormSession(req, step) {
        return get(req.session, formModel.getSessionProp(step), {});
    }

    function getStepProgress({ baseUrl, currentStepNumber }) {
        return {
            prevStepUrl: currentStepNumber > 1 ? `${baseUrl}/${currentStepNumber - 1}` : baseUrl,
            currentStepNumber: currentStepNumber,
            totalSteps: totalSteps
        };
    }

    /**
     * Route: Start page
     */
    router.get('/', function(req, res) {
        const stepConfig = formModel.getStartPage();
        res.render(stepConfig.template, {
            startUrl: `${req.baseUrl}/1`,
            stepConfig: stepConfig,
            form: formModel
        });
    });

    /**
     * Route: Form steps
     */
    formSteps.forEach((step, idx) => {
        const currentStepNumber = idx + 1;

        function renderStep(req, res, errors = []) {
            const stepData = getFormSession(req, currentStepNumber);
            res.render('pages/apply/form', {
                csrfToken: req.csrfToken(),
                form: formModel,
                step: step.withValues(stepData),
                stepProgress: getStepProgress({ baseUrl: req.baseUrl, currentStepNumber }),
                errors: errors
            });
        }

        router
            .route(`/${currentStepNumber}`)
            .all(cached.csrfProtection)
            .get(function(req, res) {
                if (currentStepNumber > 1) {
                    const previousStepData = getFormSession(req, currentStepNumber - 1);
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

                    if (currentStepNumber === formSteps.length) {
                        res.redirect(`${req.baseUrl}/review`);
                    } else {
                        res.redirect(`${req.baseUrl}/${currentStepNumber + 1}`);
                    }
                });
            });
    });

    /**
     * Route: Review
     */
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
                    stepProgress: getStepProgress({ baseUrl: req.baseUrl, currentStepNumber: totalSteps }),
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

    /**
     * Route: Success
     */
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
