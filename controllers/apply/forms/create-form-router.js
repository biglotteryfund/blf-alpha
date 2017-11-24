const { get, isEmpty, set } = require('lodash');
const { validationResult } = require('express-validator/check');
const { matchedData } = require('express-validator/filter');
const csrfProtection = require('../../../modules/csrf');

module.exports = function(router, formModel) {
    const formSteps = formModel.getSteps();
    formSteps.forEach((step, idx) => {
        const currentStepIdx = idx;
        const currentStepNumber = currentStepIdx + 1;
        const nextStepNumber = currentStepNumber + 1;
        const nextStepUrl = baseUrl => {
            if (currentStepNumber === formSteps.length) {
                return `${baseUrl}/review`;
            } else {
                return `${baseUrl}/${nextStepNumber}`;
            }
        };
        const prevStepUrl = baseUrl => {
            if (currentStepNumber > 1) {
                return `${baseUrl}/${currentStepNumber - 1}`;
            } else {
                return baseUrl;
            }
        };

        function renderStep(req, res, errors = []) {
            const stepData = get(req.session, formModel.getSessionProp(currentStepNumber), {});
            res.render('pages/experimental/apply/form', {
                csrfToken: req.csrfToken(),
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
            .route(`/${currentStepNumber}`)
            .get(csrfProtection, function(req, res) {
                if (currentStepNumber > 1) {
                    const previousStepData = get(req.session, formModel.getSessionProp(currentStepNumber - 1), {});
                    if (isEmpty(previousStepData)) {
                        res.redirect(req.baseUrl);
                    } else {
                        renderStep(req, res);
                    }
                } else {
                    renderStep(req, res);
                }
            })
            .post(step.getValidators(), csrfProtection, function(req, res) {
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

    router.get('/review', function(req, res) {
        res.cacheControl = { maxAge: 0, noStore: true };

        const formData = get(req.session, formModel.getSessionProp(), {});
        if (isEmpty(formData)) {
            res.redirect(req.baseUrl);
        } else {
            res.render('pages/experimental/apply/review', {
                form: formModel,
                review: formModel.getReviewStep(),
                summary: formModel.getStepsWithValues(formData),
                baseUrl: req.baseUrl,
                procceedUrl: `${req.baseUrl}/success`
            });
        }
    });

    router.get('/success', function(req, res) {
        res.cacheControl = { maxAge: 0, noStore: true };

        const formData = get(req.session, formModel.getSessionProp(), {});
        if (isEmpty(formData)) {
            res.redirect(req.baseUrl);
        } else {
            res.render('pages/experimental/apply/success', {
                form: formModel,
                success: formModel.getSuccessStep()
            });
        }
    });

    return router;
};
