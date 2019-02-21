'use strict';
const { cloneDeep, find, flatMap, isEmpty, set, concat } = require('lodash');
const { get, getOr } = require('lodash/fp');
const { matchedData } = require('express-validator/filter');
const { validationResult } = require('express-validator/check');
const express = require('express');
const path = require('path');

const cached = require('../../middleware/cached');
const { localify } = require('../../modules/urls');

function translateForm(formModel, locale, formData) {
    const localise = get(locale);

    const translateSection = section => {
        section.title = localise(section.title);
        if (section.summary) {
            section.summary = localise(section.summary);
        }
        if (section.introduction) {
            section.introduction = localise(section.introduction);
        }
        return section;
    };

    const translateStep = step => {
        step.title = localise(step.title);

        // Translate each fieldset
        step.fieldsets = step.fieldsets.map(fieldset => {
            fieldset.legend = localise(fieldset.legend);
            fieldset.introduction = localise(fieldset.introduction);

            // Translate each field
            fieldset.fields = fieldset.fields.map(field => {
                field.label = localise(field.label);
                field.explanation = localise(field.explanation);
                const match = find(formData, (value, name) => name === field.name);
                if (match) {
                    field.value = match;
                }

                // Translate each option (if set)
                if (field.options) {
                    field.options = field.options.map(option => {
                        option.label = localise(option.label);
                        option.explanation = localise(option.explanation);
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
    clonedForm.title = localise(formModel.title);

    clonedForm.sections = clonedForm.sections.map(section => {
        section = translateSection(section);
        section.steps = section.steps.map(step => translateStep(step));
        return section;
    });

    return clonedForm;
}

function initFormRouter(formModel) {
    const router = express.Router();

    const sessionKey = `apply.${formModel.id}`;
    const getSession = getOr({}, sessionKey);
    const setSession = (session, data) => set(session, sessionKey, { ...getSession(session), ...data });

    router.use(cached.csrfProtection, (req, res, next) => {
        // Translate the form object for each request and populate it with session data
        res.locals.form = translateForm(formModel, req.i18n.getLocale(), getSession(req.session));
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

    formModel.sections.forEach(sectionModel => {
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
            const nextStep = sectionModel.steps[stepIndex + 1];

            function redirectNext(req, res) {
                /**
                 * @TODO: Review this logic
                 * 1. If there a next step in the current section go there.
                 * 2. Otherwise go to summary screen
                 */
                if (nextStep) {
                    res.redirect(`${req.baseUrl}/${sectionModel.slug}/${currentStepNumber + 1}`);
                } else {
                    res.redirect(`${req.baseUrl}/summary`);
                }
            }

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

                if (stepModel.matchesCondition && stepModel.matchesCondition(getSession(req.session)) === false) {
                    redirectNext(req, res);
                } else {
                    res.render(path.resolve(__dirname, './views/step'), {
                        title: `${stepLocalised.title} | ${res.locals.form.title}`,
                        csrfToken: req.csrfToken(),
                        step: stepLocalised,
                        errors: errors
                    });
                }
            }

            function handleSubmitStep(req, res) {
                setSession(req.session, matchedData(req, { locations: ['body'] }));
                req.session.save(() => {
                    const errors = validationResult(req);
                    if (errors.isEmpty()) {
                        redirectNext(req, res);
                    } else {
                        renderStep(req, res, errors.array());
                    }
                });
            }

            const fieldsForStep = flatMap(stepModel.fieldsets, 'fields');
            const validators = fieldsForStep.map(field => field.validator(field));

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
        const formData = getSession(req.session);
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
