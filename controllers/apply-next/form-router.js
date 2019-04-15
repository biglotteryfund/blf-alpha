'use strict';
const { get, set, unset, concat, flatMap, head, isEmpty, omit } = require('lodash');
const express = require('express');
const path = require('path');
const Raven = require('raven');
const nunjucks = require('nunjucks');
const pdf = require('html-pdf');
const config = require('config');
const fs = require('fs');

const applicationsService = require('../../services/applications');
const cached = require('../../middleware/cached');
const { requireUserAuth } = require('../../middleware/authed');
const { normaliseErrors } = require('../../modules/errors');

const enhanceForm = require('./lib/enhance-form');
const { nextAndPrevious } = require('./lib/pagination');
const { FORM_STATES, calculateFormProgress } = require('./lib/progress');

function mapFields(fields) {
    return {
        fields: fields,
        names: fields.map(field => field.name),
        messages: fields.reduce((obj, field) => {
            obj[field.name] = field.messages;
            return obj;
        }, {})
    };
}

function fieldsForStep(step) {
    const fields = flatMap(step.fieldsets, 'fields');
    return mapFields(fields);
}

function initFormRouter(formModel) {
    const router = express.Router();

    const SESSION_PREFIX = `forms.${formModel.id}`;

    router.use(cached.csrfProtection);

    /**
     * Show a list of questions, accessible to anyone.
     * Optionally allows downloading as a PDF file (cached on disk)
     */
    router.get('/questions/:pdf?', (req, res) => {
        const form = enhanceForm({
            locale: req.i18n.getLocale(),
            baseForm: formModel
        });

        const output = {
            templates: {
                html: path.resolve(__dirname, './views/questions-html.njk'),
                pdf: path.resolve(__dirname, './views/questions-pdf.njk')
            },
            context: {
                title: form.title,
                form: form
            }
        };

        if (req.params.pdf) {
            const fileLocation = `documents/application-questions/${formModel.id}.pdf`;

            const filePath = path.resolve(__dirname, '../../public/', fileLocation);

            // First check to see if this file has already been rendered and saved in the app directory
            fs.access(filePath, fs.F_OK, accessError => {
                if (!accessError) {
                    // The file exists so just redirect the user there
                    return res.redirect(`/assets/${fileLocation}`);
                }

                // Otherwise it hasn't been rendered before, so we create it from scratch and save the file

                // Repopulate existing global context so templates render properly
                const context = { ...res.locals, ...req.app.locals, ...output.context };

                // Render the HTML template to a string
                nunjucks.render(output.templates.pdf, context, (renderErr, html) => {
                    if (renderErr) {
                        Raven.captureException(renderErr);
                        res.status(400).json({ error: 'ERR-TEMPLATE-ERROR' });
                    } else {
                        // Turn HTML into a PDF
                        pdf.create(html, {
                            format: 'A4',
                            base: config.get('domains.base'),
                            border: '40px',
                            zoomFactor: '0.7'
                        }).toBuffer((pdfError, buffer) => {
                            if (pdfError) {
                                Raven.captureException(pdfError);
                                return res.status(400).json({ error: 'ERR-PDF-BUFFER-ERROR' });
                            }

                            // Write the file locally so we can look it up next time instead of rendering
                            fs.writeFile(filePath, buffer, writeError => {
                                if (writeError) {
                                    Raven.captureException(writeError);
                                    return res.status(400).json({ error: 'ERR-PDF-WRITE-ERROR' });
                                }
                                // Give the user the file directly
                                res.setHeader('Content-Disposition', `attachment; filename=${formModel.id}.pdf`);
                                return res.status(200).send(buffer);
                            });
                        });
                    }
                });
            });
        } else {
            // Render a standard HTML page otherwise
            return res.render(output.templates.html, output.context);
        }
    });

    /**
     * Require login, redirect back here once authenticated.
     */
    router.use(requireUserAuth);

    /**
     * Set common locals
     */
    router.use(async (req, res, next) => {
        // Translate the form object for each request and populate it with current user input
        const form = enhanceForm({
            locale: req.i18n.getLocale(),
            baseForm: formModel
        });

        res.locals.formTitle = form.title;
        res.locals.formBaseUrl = req.baseUrl;
        res.locals.FORM_STATES = FORM_STATES;
        res.locals.breadcrumbs = [{ label: form.title, url: req.baseUrl }];

        res.locals.user = req.user;
        res.locals.isBilingual = formModel.isBilingual;
        res.locals.enablePrompt = false; // Disable prompts on apply pages
        res.locals.bodyClass = 'has-static-header'; // No hero images on apply pages

        next();
    });

    /**
     * Route: Dashboard
     */
    router.route('/').get(async function(req, res) {
        const applications = await applicationsService.getApplicationsForUser({
            userId: req.user.userData.id,
            formId: formModel.id
        });

        const form = enhanceForm({
            locale: req.i18n.getLocale(),
            baseForm: formModel
        });

        const applicationsWithProgress = applications.map(application => {
            application.progress = calculateFormProgress(form, get(application, 'application_data'));
            return application;
        });

        res.render(path.resolve(__dirname, './views/dashboard'), {
            title: res.locals.formTitle,
            applications: applicationsWithProgress,
            form: form
        });
    });

    /**
     * Route: New Application
     */
    function renderNewApplication(req, res, data = null, errors = []) {
        const form = enhanceForm({
            locale: req.i18n.getLocale(),
            baseForm: formModel,
            data: data
        });

        res.render(path.resolve(__dirname, './views/new'), {
            title: res.locals.formTitle,
            csrfToken: req.csrfToken(),
            fields: form.newApplicationFields,
            errors: errors
        });
    }

    router
        .route('/new')
        .get(function(req, res) {
            renderNewApplication(req, res);
        })
        .post(async (req, res) => {
            const validationResult = formModel.schema.validate(req.body, {
                abortEarly: false,
                stripUnknown: true,
                escapeHtml: true
            });

            const fields = mapFields(formModel.newApplicationFields);
            const errors = normaliseErrors({
                validationError: validationResult.error,
                errorMessages: fields.messages,
                fieldNames: fields.names,
                locale: req.i18n.getLocale()
            });

            if (errors.length > 0) {
                renderNewApplication(req, res, validationResult.value, errors);
            } else {
                try {
                    const application = await applicationsService.createApplication({
                        userId: req.user.userData.id,
                        formId: formModel.id,
                        title: get(validationResult.value, 'application-title'),
                        data: validationResult.value
                    });

                    res.redirect(`${req.baseUrl}/edit/${application.id}`);
                } catch (error) {
                    Raven.captureException(error);
                    renderError(error, req, res);
                }
            }
        });

    /**
     * Route: Edit application ID
     * Store the ID of the application currently being edited
     */
    router.get('/edit/:applicationId', async (req, res) => {
        const { applicationId } = req.params;
        if (applicationId) {
            set(req.session, `${SESSION_PREFIX}.currentEditingId`, applicationId);
            req.session.save(() => {
                const firstSection = head(formModel.sections);
                res.redirect(`${req.baseUrl}/${firstSection.slug}`);
            });
        } else {
            res.redirect(req.baseUrl);
        }
    });

    // Allow an application owned by this user to be deleted
    router
        .route('/delete/:applicationId')
        .get(async (req, res) => {
            if (req.params.applicationId && req.user.userData.id) {
                const application = await applicationsService.getApplicationById({
                    formId: formModel.id,
                    applicationId: req.params.applicationId,
                    userId: req.user.userData.id
                });

                if (!application) {
                    return res.redirect(req.baseUrl);
                }

                res.render(path.resolve(__dirname, './views/delete'), {
                    title: res.locals.formTitle,
                    csrfToken: req.csrfToken()
                });
            } else {
                res.redirect(req.baseUrl);
            }
        })
        .post(async (req, res) => {
            try {
                await applicationsService.deleteApplication(req.params.applicationId, req.user.userData.id);
                // @TODO show a success message on the subsequent (dashboard?) screen
                res.redirect(req.baseUrl);
            } catch (error) {
                renderError(error, req, res);
            }
        });

    /**
     * Require application
     * All routes after this point require an application to be selected
     */
    router.use(async (req, res, next) => {
        const currentEditingId = get(req.session, `${SESSION_PREFIX}.currentEditingId`);

        if (currentEditingId) {
            res.locals.currentlyEditingId = currentEditingId;

            try {
                const application = await applicationsService.getApplicationById({
                    formId: formModel.id,
                    applicationId: currentEditingId,
                    userId: req.user.userData.id
                });

                if (application) {
                    const currentApplicationData = get(application, 'application_data');
                    res.locals.currentApplicationTitle = get(application, 'application_title');
                    res.locals.currentApplicationData = currentApplicationData;
                    res.locals.currentApplicationStatus = get(application, 'status');

                    res.locals.form = enhanceForm({
                        locale: req.i18n.getLocale(),
                        baseForm: formModel,
                        data: currentApplicationData
                    });
                    next();
                } else {
                    res.redirect(req.baseUrl);
                }
            } catch (error) {
                Raven.captureException(new Error(`Unable to find application ${currentEditingId}`));
                res.redirect(req.baseUrl);
            }
        } else {
            res.redirect(req.baseUrl);
        }
    });

    /**
     * Route: Eligibility checker
     */
    router
        .route('/eligibility/:step?')
        .all((req, res, next) => {
            if (res.locals.currentApplicationStatus === 'ineligible') {
                return res.redirect(`${req.baseUrl}`);
            }

            res.locals.eligibilityQuestions = formModel.eligibilityQuestions;

            if (!req.params.step || req.params.step > res.locals.eligibilityQuestions.length) {
                return res.redirect(`${req.baseUrl}/eligibility/1`);
            }

            res.locals.currentStepNumber = parseInt(req.params.step);

            // See how far this user has progressed with these questions
            // (eg. to prevent URL tampering)
            const currentProgress = parseInt(
                get(req.session, `${SESSION_PREFIX}.eligibilityProgress.${res.locals.currentlyEditingId}`)
            );

            // Prevent skipping ahead
            if (currentProgress < res.locals.currentStepNumber) {
                return res.redirect(`${req.baseUrl}/eligibility/${currentProgress}`);
            }

            res.locals.currentStep = res.locals.eligibilityQuestions[res.locals.currentStepNumber - 1];
            next();
        })
        .get((req, res) => {
            res.render(path.resolve(__dirname, './views/eligibility'), {
                eligibility: 'pending',
                csrfToken: req.csrfToken(),
                questions: res.locals.eligibilityQuestions
            });
        })
        .post(async (req, res) => {
            const stepAnswer = req.body.eligibility;
            if (!stepAnswer || stepAnswer !== 'yes') {
                // Mark this application as ineligible and show an error
                await applicationsService.changeApplicationState(res.locals.currentlyEditingId, 'ineligible');
                res.render(path.resolve(__dirname, './views/eligibility'), {
                    eligibility: 'ineligible'
                });
            } else {
                const isComplete = res.locals.currentStepNumber === res.locals.eligibilityQuestions.length;
                const nextStepNumber = res.locals.currentStepNumber + 1;
                if (!isComplete) {
                    // Store their progress in their session
                    set(
                        req.session,
                        `${SESSION_PREFIX}.eligibilityProgress.${res.locals.currentlyEditingId}`,
                        nextStepNumber
                    );
                    res.redirect(`${req.baseUrl}/eligibility/${nextStepNumber}`);
                } else {
                    await applicationsService.changeApplicationState(res.locals.currentlyEditingId, 'eligible');
                    res.render(path.resolve(__dirname, './views/eligibility'), {
                        eligibility: 'eligible'
                    });
                }
            }
        });

    // Any pages after this point must be for eligible applications
    router.use((req, res, next) => {
        return res.locals.currentApplicationStatus === 'eligible' || res.locals.currentApplicationStatus === 'complete'
            ? next()
            : res.redirect(`${req.baseUrl}/eligibility/1`);
    });

    /**
     * Routes: Form sections
     */
    formModel.sections.forEach((currentSection, currentSectionIndex) => {
        router.get(`/${currentSection.slug}`, (req, res) => {
            res.redirect(`${req.baseUrl}/${currentSection.slug}/1`);
        });

        /**
         * Route: Section steps
         */
        currentSection.steps.forEach((currentStep, currentStepIndex) => {
            const currentStepNumber = currentStepIndex + 1;
            const numSteps = currentSection.steps.length;

            function renderStep(req, res, data, errors = []) {
                const form = enhanceForm({
                    locale: req.i18n.getLocale(),
                    baseForm: formModel,
                    data: data
                });

                const sectionLocalised = form.sections.find(s => s.slug === currentSection.slug);
                const stepLocalised = sectionLocalised.steps[currentStepIndex];

                res.locals.breadcrumbs = concat(
                    res.locals.breadcrumbs,
                    { label: sectionLocalised.title, url: `${req.baseUrl}/${currentSection.slug}` },
                    { label: `${stepLocalised.title} (Step ${currentStepNumber} of ${numSteps})` }
                );

                const { nextUrl, previousUrl } = nextAndPrevious({
                    baseUrl: req.baseUrl,
                    sections: form.sections,
                    currentSectionIndex: currentSectionIndex,
                    currentStepIndex: currentStepIndex
                });

                if (stepLocalised.isRequired) {
                    res.render(path.resolve(__dirname, './views/step'), {
                        previousUrl,
                        nextUrl,
                        title: `${stepLocalised.title} | ${form.title}`,
                        csrfToken: req.csrfToken(),
                        step: stepLocalised,
                        errors: errors
                    });
                } else {
                    res.redirect(nextUrl);
                }
            }

            router
                .route(`/${currentSection.slug}/${currentStepNumber}`)
                .get((req, res) => {
                    renderStep(req, res, res.locals.currentApplicationData);
                })
                .post(async function(req, res) {
                    const { currentlyEditingId, currentApplicationData } = res.locals;
                    const stepFields = fieldsForStep(currentStep);

                    /**
                     * Validate the all the data so far against validation schema
                     * - Validating against the whole form ensures that conditional validations are taken into account
                     * - We include `stripUnknown` to exclude any values that are required in the POST body,
                     *   like request forgery tokens, but not needed as part of the submission data.
                     * @see https://github.com/hapijs/joi/blob/master/API.md#validatevalue-schema-options-callback
                     */
                    const dataToValidate = { ...currentApplicationData, ...req.body };
                    const validationResult = formModel.schema.validate(dataToValidate, {
                        abortEarly: false,
                        stripUnknown: true,
                        escapeHtml: true
                    });

                    /**
                     * Get the errors for the current step
                     * We validate against the whole form schema so need to limit the errors to the current step
                     */
                    const errors = normaliseErrors({
                        validationError: validationResult.error,
                        errorMessages: stepFields.messages,
                        fieldNames: stepFields.names,
                        locale: req.i18n.getLocale()
                    });

                    /**
                     * Prepare data for storage
                     * Exclude any values in the current submission which have errors
                     */
                    const newFormData = omit(validationResult.value, errors.map(err => err.param));

                    try {
                        await applicationsService.updateApplication(currentlyEditingId, newFormData);

                        const form = enhanceForm({
                            locale: req.i18n.getLocale(),
                            baseForm: formModel,
                            data: newFormData
                        });

                        /**
                         * If there are errors re-render the step with errors
                         * - Pass the full data object from validationResult to the view. Including invalid values.
                         * Otherwise, find the next suitable step and redirect there.
                         */
                        if (errors.length > 0) {
                            renderStep(req, res, validationResult.value, errors);
                        } else {
                            const { nextUrl } = nextAndPrevious({
                                baseUrl: req.baseUrl,
                                sections: form.sections,
                                currentSectionIndex: currentSectionIndex,
                                currentStepIndex: currentStepIndex
                            });
                            res.redirect(nextUrl);
                        }
                    } catch (error) {
                        renderError(error, req, res);
                    }
                });
        });
    });

    function renderError(error, req, res) {
        const errorCopy = req.i18n.__('apply.error');
        res.render(path.resolve(__dirname, './views/error'), {
            error: error,
            title: errorCopy.title,
            errorCopy: errorCopy,
            returnUrl: `${req.baseUrl}/summary`
        });
    }

    /**
     * Route: Summary
     */
    router.route('/summary').get(function(req, res) {
        const { form, currentApplicationData } = res.locals;
        res.locals.breadcrumbs = concat(res.locals.breadcrumbs, { label: 'Summary' });
        res.render(path.resolve(__dirname, './views/summary'), {
            progress: calculateFormProgress(form, currentApplicationData),
            csrfToken: req.csrfToken()
        });
    });

    /**
     * Route: Terms and Conditions
     */
    router
        .route('/terms')
        .all((req, res, next) => {
            const { currentApplicationData } = res.locals;
            res.locals.breadcrumbs = concat(res.locals.breadcrumbs, { label: 'Terms & Conditions' });

            res.locals.form = enhanceForm({
                locale: req.i18n.getLocale(),
                baseForm: formModel,
                data: currentApplicationData
            });

            const validationResult = formModel.schema.validate(currentApplicationData, {
                abortEarly: false,
                stripUnknown: true
            });

            const errors = get(validationResult, 'error.details', []);

            if (errors.length > 0) {
                res.redirect(`${req.baseUrl}/summary`);
            } else {
                next();
            }
        })
        .get(function(req, res) {
            res.render(path.resolve(__dirname, './views/terms'), {
                csrfToken: req.csrfToken()
            });
        })
        .post(async (req, res) => {
            // @TODO: Validate fields on terms screen?
            try {
                await formModel.processor({
                    form: res.locals.form,
                    data: res.locals.currentApplicationData
                });
                await applicationsService.changeApplicationState(res.locals.currentlyEditingId, 'complete');
                res.redirect(`${req.baseUrl}/success`);
            } catch (error) {
                Raven.captureException(error);
                renderError(error, req, res);
            }
        });

    /**
     * Route: Success
     */
    router.get('/success', function(req, res) {
        if (isEmpty(res.locals.currentApplicationData)) {
            res.redirect(req.baseUrl);
        } else {
            // Clear the submission from the session on success
            unset(req.session, SESSION_PREFIX);
            req.session.save(() => {
                res.render(path.resolve(__dirname, './views/success'), {
                    form: res.locals.form,
                    title: 'Success'
                });
            });
        }
    });

    return router;
}

module.exports = {
    initFormRouter
};
