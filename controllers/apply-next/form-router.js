'use strict';
const { cloneDeep, find, flatMap, get, isEmpty, set } = require('lodash');
const { matchedData } = require('express-validator/filter');
const { check, validationResult } = require('express-validator/check');
const express = require('express');
const path = require('path');

const cached = require('../../middleware/cached');
const { localify } = require('../../modules/urls');

const translateField = (field, locale) => {
    return get(field, locale);
};

// @TODO this does not translate nested fields – should it?
const translateSection = (section, locale) => {
    const clonedSection = cloneDeep(section);
    clonedSection.title = translateField(clonedSection.title, locale);
    if (clonedSection.summary) {
        clonedSection.summary = translateField(clonedSection.summary, locale);
    }
    return clonedSection;
};

const translateStep = (step, locale, values) => {
    const clonedStep = cloneDeep(step);
    clonedStep.title = translateField(clonedStep.title, locale);

    // Translate each fieldset
    clonedStep.fieldsets = clonedStep.fieldsets.map(fieldset => {
        fieldset.legend = translateField(fieldset.legend, locale);
        // Translate each field
        fieldset.fields = fieldset.fields.map(field => {
            field.label = translateField(field.label, locale);
            field.explanation = translateField(field.explanation, locale);
            const match = find(values, (value, name) => name === field.name);
            if (match) {
                field.value = match;
            }

            // Translate each option (if set)
            if (field.options) {
                field.options = field.options.map(option => {
                    option.label = translateField(option.label, locale);
                    return option;
                });
            }
            return field;
        });

        return fieldset;
    });

    return clonedStep;
};

function getFieldValidator(field) {
    if (field.validator) {
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
}

function formWithValues(formModel, locale, formData) {
    const clonedForm = cloneDeep(formModel);
    clonedForm.sections = clonedForm.sections.map(section => {
        section.steps = section.steps.map(step => translateStep(step, locale, formData));
        return section;
    });
    return clonedForm;
}

function initFormRouter(form) {
    const router = express.Router();

    const getSessionData = session => get(session, `apply.${form.id}`, {});

    const setSessionData = (session, newData) => {
        const formData = getSessionData(session);
        set(session, `apply.${form.id}`, Object.assign(formData, newData));
    };

    router.use(cached.csrfProtection, (req, res, next) => {
        res.locals.formTitle = translateField(form.title, req.i18n.getLocale());
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
                title: res.locals.formTitle,
                startUrl: `${req.baseUrl}/${form.sections[0].slug}`
            });
        } else if (startPage.urlPath) {
            res.redirect(localify(req.i18n.getLocale())(startPage.urlPath));
        } else {
            throw new Error('No valid startpage types found');
        }
    });

    form.sections.forEach((sectionModel, sectionIndex) => {
        /**
         * Route: Form sections
         */
        router.get(`/${sectionModel.slug}`, (req, res) => {
            const locale = req.i18n.getLocale();
            const sectionLocalised = translateSection(sectionModel, locale);
            if (sectionLocalised.summary) {
                res.render(path.resolve(__dirname, './views/section-summary'), {
                    title: `${sectionLocalised.title} | ${res.locals.formTitle}`,
                    section: sectionLocalised,
                    backUrl: null, // @TODO: Determine backUrl
                    nextUrl: `${req.baseUrl}/${sectionModel.slug}/1`
                });
            } else {
                res.redirect(`${req.baseUrl}/${sectionModel.slug}/1`);
            }
        });

        /**
         * Route: Section steps
         */
        sectionModel.steps.forEach((stepModel, stepIndex) => {
            const currentStepNumber = stepIndex + 1;

            function renderStep(req, res, errors = []) {
                const formData = getSessionData(req.session);
                const stepLocalisedWithValues = translateStep(stepModel, req.i18n.getLocale(), formData);
                res.render(path.resolve(__dirname, './views/step'), {
                    title: `${stepLocalisedWithValues.title} | ${res.locals.formTitle}`,
                    csrfToken: req.csrfToken(),
                    step: stepLocalisedWithValues,
                    errors: errors
                });
            }

            function handleSubmitStep(req, res) {
                setSessionData(req.session, matchedData(req, { locations: ['body'] }));
                req.session.save(() => {
                    const errors = validationResult(req);
                    if (errors.isEmpty()) {
                        /**
                         * @TODO: Review this logic
                         * 1. Is there a next step go there.
                         * 2. If there is a next section go there.
                         * 3. Otherwise go to summary screen
                         */
                        const nextStep = sectionModel.steps[stepIndex + 1];
                        const nextSection = form.sections[sectionIndex + 1];

                        if (nextStep) {
                            res.redirect(`${req.baseUrl}/${sectionModel.slug}/${currentStepNumber + 1}`);
                        } else if (nextSection) {
                            res.redirect(`${req.baseUrl}/${nextSection.slug}`);
                        } else {
                            res.redirect(`${req.baseUrl}/summary`);
                        }
                    } else {
                        renderStep(req, res, errors.array());
                    }
                });
            }

            const fieldsForStep = flatMap(stepModel.fieldsets, 'fields');
            const validators = fieldsForStep.map(getFieldValidator);

            router
                .route(`/${sectionModel.slug}/${currentStepNumber}`)
                .get((req, res) => renderStep(req, res))
                .post(validators, handleSubmitStep);
        });
    });

    /**
     * Route: Summary
     */
    router.route('/summary').get(function(req, res) {
        const formData = getSessionData(req.session);
        if (isEmpty(formData)) {
            res.redirect(req.baseUrl);
        } else {
            res.render(path.resolve(__dirname, './views/summary'), {
                form: formWithValues(form, req.i18n.getLocale(), formData),
                csrfToken: req.csrfToken()
            });
        }
    });

    return router;
}

module.exports = {
    initFormRouter
};
