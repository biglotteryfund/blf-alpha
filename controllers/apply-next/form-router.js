'use strict';
const { cloneDeep, find, flatMap, get, isEmpty, set, concat } = require('lodash');
const { matchedData } = require('express-validator/filter');
const { check, validationResult } = require('express-validator/check');
const express = require('express');
const path = require('path');

const cached = require('../../middleware/cached');
const { localify } = require('../../modules/urls');

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

function translateForm(formModel, locale, formData) {
    const translateField = field => get(field, locale);

    const translateSection = section => {
        section.title = translateField(section.title, locale);
        if (section.summary) {
            section.summary = translateField(section.summary, locale);
        }
        if (section.introduction) {
            section.introduction = translateField(section.introduction, locale);
        }
        return section;
    };

    const translateStep = step => {
        step.title = translateField(step.title, locale);

        // Translate each fieldset
        step.fieldsets = step.fieldsets.map(fieldset => {
            fieldset.legend = translateField(fieldset.legend, locale);
            // Translate each field
            fieldset.fields = fieldset.fields.map(field => {
                field.label = translateField(field.label, locale);
                field.explanation = translateField(field.explanation, locale);
                const match = find(formData, (value, name) => name === field.name);
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

        return step;
    };

    const clonedForm = cloneDeep(formModel);
    clonedForm.title = translateField(formModel.title, locale);

    clonedForm.sections = clonedForm.sections.map(section => {
        section = translateSection(section, locale);
        section.steps = section.steps.map(step => translateStep(step, locale, formData));
        return section;
    });

    return clonedForm;
}

function initFormRouter(formModel) {
    const router = express.Router();

    const getSessionData = session => get(session, `apply.${formModel.id}`, {});

    const setSessionData = (session, newData) => {
        const formData = getSessionData(session);
        set(session, `apply.${formModel.id}`, Object.assign(formData, newData));
    };

    router.use(cached.csrfProtection, (req, res, next) => {
        // Translate the form object for each request and populate it with session data
        res.locals.form = translateForm(formModel, req.i18n.getLocale(), getSessionData(req.session));
        res.locals.formTitle = 'Application form: ' + res.locals.form.title;
        res.locals.isBilingual = formModel.isBilingual;
        res.locals.enablePrompt = false; // Disable prompts on apply pages
        res.locals.bodyClass = 'has-static-header'; // No hero images on apply pages
        res.locals.formBaseUrl = req.baseUrl;
        res.locals.breadcrumbs = [
            {
                label: res.locals.form.title,
                url: req.baseUrl
            }
        ];
        next();
    });

    /**
     * Route: Start page
     */
    router.get('/', cached.noCache, function(req, res) {
        const { startPage } = res.locals.form;
        if (!startPage) {
            throw new Error('No startpage found');
        }

        const firstSection = res.locals.form.sections[0];

        if (startPage.template) {
            res.render(startPage.template, {
                title: res.locals.form.title,
                startUrl: `${req.baseUrl}/${firstSection.slug}`
            });
        } else if (startPage.urlPath) {
            res.redirect(localify(req.i18n.getLocale())(startPage.urlPath));
        } else {
            throw new Error('No valid startpage types found');
        }
    });

    formModel.sections.forEach((sectionModel, sectionIndex) => {
        /**
         * Route: Form sections
         */
        router.get(`/${sectionModel.slug}`, (req, res) => {
            const sectionLocalised = res.locals.form.sections.find(s => s.slug === sectionModel.slug);
            if (sectionLocalised.summary) {
                res.locals.breadcrumbs = concat(res.locals.breadcrumbs, {
                    label: sectionLocalised.title
                });
                res.render(path.resolve(__dirname, './views/section-summary'), {
                    title: `${sectionLocalised.title} | ${res.locals.form.title}`,
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
            const numSteps = sectionModel.steps.length;

            function renderStep(req, res, errors = []) {
                const sectionLocalised = res.locals.form.sections.find(s => s.slug === sectionModel.slug);
                const stepLocalised = sectionLocalised.steps[stepIndex];
                res.locals.breadcrumbs = concat(
                    res.locals.breadcrumbs,
                    {
                        label: sectionLocalised.title,
                        url: `${req.baseUrl}/${sectionModel.slug}`
                    },
                    {
                        label: `${stepLocalised.title} (Step ${currentStepNumber} of ${numSteps})`
                    }
                );
                res.render(path.resolve(__dirname, './views/step'), {
                    title: `${stepLocalised.title} | ${res.locals.form.title}`,
                    csrfToken: req.csrfToken(),
                    step: stepLocalised,
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
                        const nextSection = formModel.sections[sectionIndex + 1];

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
            res.locals.breadcrumbs = concat(res.locals.breadcrumbs, {
                label: 'Summary'
            });
            res.render(path.resolve(__dirname, './views/summary'), {
                form: res.locals.form,
                csrfToken: req.csrfToken()
            });
        }
    });

    return router;
}

module.exports = {
    initFormRouter
};
