'use strict';
const { flatMap, get, isEmpty, set, unset } = require('lodash');
const { matchedData } = require('express-validator/filter');
const { check, validationResult } = require('express-validator/check');
const express = require('express');
const path = require('path');
const Raven = require('raven');

const appData = require('../../modules/appData');
const cached = require('../../middleware/cached');
const { injectHeroImage } = require('../../middleware/inject-content');

const { flattenFormData, stepWithValues, stepsWithValues } = require('./helpers');
const reachingCommunitiesForm = require('./reaching-communities/form-model');
const digitalFundingForm = require('./digital-funding/form-model');

/**
 * Collect all validators associated with each field for express-validator
 */
function getValidators(step) {
    const fields = flatMap(step.fieldsets, 'fields');
    return fields.map(field => {
        if (field.validator) {
            return field.validator(field);
        } else if (field.isRequired === true) {
            return check(field.name)
                .trim()
                .not()
                .isEmpty()
                .withMessage(field.errorMessage || `“${field.label}” must be provided`);
        } else {
            return check(field.name)
                .trim()
                .optional();
        }
    });
}

function initFormRouter(form) {
    const router = express.Router();

    function getSessionProp(stepNo) {
        const baseProp = `form.${form.id}`;
        if (stepNo) {
            return `${baseProp}.step-${stepNo}`;
        }

        return baseProp;
    }

    router.use((req, res, next) => {
        const copy = form.lang ? req.i18n.__(form.lang) : {};
        res.locals.copy = copy;
        res.locals.formTitle = copy.title || form.title;
        res.locals.formSubtitle = copy.subtitle || form.subtitle;
        res.locals.isBilingual = form.isBilingual;
        res.locals.pageAccent = form.pageAccent || 'pink';
        res.locals.enablePrompt = false; // Disable prompts on apply pages
        next();
    });

    router.use(injectHeroImage(form.heroSlug));

    const totalSteps = form.steps.length + 1; // allow for the review 'step'

    function getFormSession(req, step) {
        return get(req.session, getSessionProp(step), {});
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
    router.get('/', cached.noCache, function(req, res) {
        const { startPage } = form;
        if (!startPage) {
            throw new Error('No startpage found');
        }

        if (startPage.template) {
            res.render(startPage.template, {
                title: form.title,
                startUrl: `${req.baseUrl}/1`,
                stepConfig: startPage,
                form: form
            });
        } else if (startPage.urlPath) {
            res.redirect(startPage.urlPath);
        } else {
            throw new Error('No valid startpage types found');
        }
    });

    /**
     * Route: Form steps
     */
    form.steps.forEach((step, idx) => {
        const currentStepNumber = idx + 1;

        function renderStep(req, res, errors = []) {
            const stepData = getFormSession(req, currentStepNumber);

            res.render(path.resolve(__dirname, './views/form'), {
                csrfToken: req.csrfToken(),
                form: form,
                step: stepWithValues(step, stepData),
                stepProgress: getStepProgress({ baseUrl: req.baseUrl, currentStepNumber }),
                errors: errors
            });
        }

        function renderStepIfAllowed(req, res) {
            if (currentStepNumber > 1 && isEmpty(getFormSession(req, currentStepNumber - 1))) {
                res.redirect(req.baseUrl);
            } else {
                renderStep(req, res);
            }
        }

        function handleSubmitStep(isEditing = false) {
            return function(req, res) {
                const sessionProp = getSessionProp(currentStepNumber);
                const stepData = get(req.session, sessionProp, {});
                const bodyData = matchedData(req, { locations: ['body'] });
                set(req.session, sessionProp, Object.assign(stepData, bodyData));

                req.session.save(() => {
                    const errors = validationResult(req);
                    if (errors.isEmpty()) {
                        if (isEditing === true || currentStepNumber === form.steps.length) {
                            res.redirect(`${req.baseUrl}/review`);
                        } else {
                            res.redirect(`${req.baseUrl}/${currentStepNumber + 1}`);
                        }
                    } else {
                        renderStep(req, res, errors.array());
                    }
                });
            };
        }

        /**
         * Step router
         */
        router
            .route(`/${currentStepNumber}`)
            .all(cached.csrfProtection)
            .get(renderStepIfAllowed)
            .post(getValidators(step), handleSubmitStep());

        /**
         * Step edit router
         */
        router
            .route(`/${currentStepNumber}/edit`)
            .all(cached.csrfProtection)
            .get(function(req, res) {
                const formSession = getFormSession(req);
                const completedSteps = Object.keys(formSession).filter(key => /^step-/.test(key)).length;
                if (completedSteps < totalSteps - 1) {
                    res.redirect(req.originalUrl.replace('/edit', ''));
                } else {
                    renderStepIfAllowed(req, res);
                }
            })
            .post(getValidators(step), handleSubmitStep(true));
    });

    function renderError(error, req, res) {
        const stepConfig = form.errorStep;
        const stepCopy = get(res.locals.copy, 'error', {});
        res.render(path.resolve(__dirname, './views/error'), {
            error: error,
            form: form,
            title: stepCopy.title || stepConfig.title,
            stepCopy: stepCopy,
            stepConfig: stepConfig,
            returnUrl: `${req.baseUrl}/review`
        });
    }

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
                const stepConfig = form.reviewStep;
                const stepCopy = get(res.locals.copy, 'review', {});

                res.render(path.resolve(__dirname, './views/review'), {
                    form: form,
                    title: stepCopy.title || stepConfig.title,
                    stepCopy: stepCopy,
                    stepConfig: stepConfig,
                    stepProgress: getStepProgress({ baseUrl: req.baseUrl, currentStepNumber: totalSteps }),
                    summary: stepsWithValues(form.steps, formData),
                    baseUrl: req.baseUrl,
                    csrfToken: req.csrfToken()
                });
            }
        })
        .post(async function(req, res) {
            const formData = getFormSession(req);

            if (isEmpty(formData)) {
                res.redirect(req.baseUrl);
            } else {
                try {
                    await form.processor({
                        form: form,
                        data: flattenFormData(formData),
                        stepsWithValues: stepsWithValues(form.steps, formData)
                    });
                    res.redirect(`${req.baseUrl}/success`);
                } catch (error) {
                    Raven.captureException(error);
                    renderError(error, req, res);
                }
            }
        });

    /**
     * Route: Success
     */
    router.get('/success', cached.noCache, function(req, res) {
        const formData = getFormSession(req);
        const stepConfig = form.successStep;
        const stepCopy = get(res.locals.copy, 'success', {});

        if (isEmpty(formData)) {
            res.redirect(req.baseUrl);
        } else {
            // Clear the submission from the session on success
            unset(req.session, getSessionProp());
            req.session.save(() => {
                res.render(stepConfig.template, {
                    form: form,
                    title: stepCopy.title,
                    stepCopy: stepCopy,
                    stepConfig: stepConfig
                });
            });
        }
    });

    return router;
}

module.exports = ({ router }) => {
    router.get('/', (req, res) => {
        res.redirect('/');
    });

    router.use('/your-idea', initFormRouter(reachingCommunitiesForm));

    if (appData.isNotProduction) {
        router.use('/digital-funding-1', initFormRouter(digitalFundingForm(1)));
        router.use('/digital-funding-2', initFormRouter(digitalFundingForm(2)));
    }

    return router;
};
