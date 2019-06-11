'use strict';
const express = require('express');
const path = require('path');
const Sentry = require('@sentry/node');
const concat = require('lodash/concat');
const get = require('lodash/get');
const isEmpty = require('lodash/isEmpty');
const set = require('lodash/set');
const unset = require('lodash/unset');
const debug = require('debug')('tnlcf:form-router');
const features = require('config').get('features');

const {
    PendingApplication,
    SubmittedApplication
} = require('../../../db/models');

const appData = require('../../../common/appData');
const { csrfProtection } = require('../../../middleware/cached');
const { requireUserAuth } = require('../../../middleware/authed');
const { injectCopy } = require('../../../middleware/inject-content');

const salesforceService = require('./lib/salesforce');

function initFormRouter({
    formId,
    eligibilityBuilder = null,
    formBuilder,
    confirmationBuilder
}) {
    const router = express.Router();

    function sessionPrefix() {
        return `forms.${formId}`;
    }

    function getCurrentlyEditingId(req) {
        return get(req.session, `${sessionPrefix()}.currentEditingId`);
    }

    function setCurrentlyEditingId(req, applicationId) {
        return set(
            req.session,
            `${sessionPrefix()}.currentEditingId`,
            applicationId
        );
    }

    function unsetCurrentlyEditingId(req, callbackFn) {
        unset(req.session, `${sessionPrefix()}.currentEditingId`);
        req.session.save(callbackFn);
    }

    function setCommonLocals(req, res, next) {
        const form = formBuilder({
            locale: req.i18n.getLocale()
        });

        res.locals.formTitle = form.title;
        res.locals.formBaseUrl = req.baseUrl;
        res.locals.breadcrumbs = [{ label: form.title, url: req.baseUrl }];

        res.locals.user = req.user;
        res.locals.isBilingual = form.isBilingual;
        res.locals.enableSiteSurvey = false;
        res.locals.bodyClass = 'has-static-header'; // No hero images on apply pages

        next();
    }

    router.use(csrfProtection, injectCopy('applyNext'), setCommonLocals);

    /**
     * Publicly accessible routes .
     */
    router.use('/questions', require('./questions')(formId, formBuilder));
    router.use('/eligibility', require('./eligibility')(eligibilityBuilder));

    /**
     * Require authentication past this point
     */
    router.use(requireUserAuth);

    /**
     * Route: Dashboard
     */
    router.use('/', require('./dashboard')(formId, formBuilder));

    /**
     * Start application
     * Redirect to eligibility checker
     */
    router.get('/start', function(req, res) {
        res.redirect(`${req.baseUrl}/eligibility/1`);
    });

    /**
     * New application
     * Create a new blank application and redirect to first step
     */
    router.get('/new', async function(req, res, next) {
        try {
            const application = await PendingApplication.createNewApplication({
                formId: formId,
                userId: req.user.userData.id
            });

            setCurrentlyEditingId(req, application.id);
            req.session.save(() => {
                const form = formBuilder({
                    locale: req.i18n.getLocale()
                });
                res.redirect(`${req.baseUrl}/${form.sections[0].slug}`);
            });
        } catch (error) {
            next(error);
        }
    });

    /**
     * Route: Edit application ID
     * Store the ID of the application currently being edited
     */
    router.get('/edit/:applicationId', async (req, res) => {
        if (req.params.applicationId) {
            setCurrentlyEditingId(req, req.params.applicationId);
            req.session.save(() => {
                res.redirect(`${req.baseUrl}/summary`);
            });
        } else {
            res.redirect(req.baseUrl);
        }
    });

    /**
     * Route: Delete application
     */
    router.use('/delete', require('./delete')(formId));

    /**
     * Require application
     * All routes after this point require an application to be selected
     */
    router.use(async (req, res, next) => {
        const currentEditingId = getCurrentlyEditingId(req);
        if (currentEditingId) {
            res.locals.currentlyEditingId = currentEditingId;

            try {
                const currentApplication = await PendingApplication.findApplicationForForm(
                    {
                        formId: formId,
                        applicationId: currentEditingId,
                        userId: req.user.userData.id
                    }
                );

                if (currentApplication) {
                    const currentApplicationData = get(
                        currentApplication,
                        'applicationData',
                        {}
                    );

                    res.locals.currentApplication = currentApplication;
                    res.locals.currentApplicationData = currentApplicationData;

                    res.locals.currentApplicationStatus = get(
                        currentApplication,
                        'status'
                    );

                    next();
                } else {
                    res.redirect(req.baseUrl);
                }
            } catch (error) {
                Sentry.captureException(
                    new Error(`Unable to find application ${currentEditingId}`)
                );
                res.redirect(req.baseUrl);
            }
        } else {
            res.redirect(req.baseUrl);
        }
    });

    /**
     * Route: Summary
     */
    router.route('/summary').get(function(req, res) {
        const { copy, currentApplicationData } = res.locals;

        const form = formBuilder({
            locale: req.i18n.getLocale(),
            data: currentApplicationData
        });

        const title = copy.summary.title;

        res.render(path.resolve(__dirname, './views/summary'), {
            csrfToken: req.csrfToken(),
            title: title,
            form: form,
            breadcrumbs: concat(res.locals.breadcrumbs, { label: title }),
            currentProjectName: get(currentApplicationData, 'projectName')
        });
    });

    /**
     * Route: Terms and Conditions
     */
    router.route('/terms').get(function(req, res) {
        const form = formBuilder({
            locale: req.i18n.getLocale(),
            data: res.locals.currentApplicationData
        });

        if (form.validation.isValid) {
            res.render(path.resolve(__dirname, './views/terms'), {
                csrfToken: req.csrfToken(),
                breadcrumbs: res.locals.breadcrumbs.concat({
                    label: 'Terms & Conditions'
                }),
                form: form
            });
        } else {
            res.redirect(`${req.baseUrl}/summary`);
        }
    });

    /**
     * Route: Submission
     */
    router.post('/submission', async (req, res, next) => {
        const { currentApplication, currentApplicationData } = res.locals;

        function canSubmit() {
            return isEmpty(currentApplication) === false;
        }

        function canSubmitToSalesforce() {
            return (
                features.enableSalesforceConnector === true &&
                !!process.env.TEST_SERVER === false
            );
        }

        if (canSubmit() === true) {
            const form = formBuilder({
                locale: req.i18n.getLocale(),
                data: currentApplicationData
            });

            try {
                /**
                 * Increment submission attempts
                 * Allows us to report on failed submission attempts.
                 */
                await currentApplication.increment('submissionAttempts');

                /**
                 * Construct salesforce submission data
                 * We also attach this to the SubmittedApplication record
                 */
                let salesforceId = null;
                const salesforceFormData = {
                    application: form.forSalesforce(),
                    meta: {
                        form: formId,
                        environment: appData.environment,
                        commitId: appData.commitId,
                        username: req.user.userData.username,
                        applicationId: currentApplication.id,
                        startedAt: currentApplication.createdAt.toISOString()
                    }
                };

                /**
                 * Store submission in salesforce if enabled
                 */
                if (canSubmitToSalesforce() === true) {
                    const salesforce = await salesforceService.authorise();
                    salesforceId = await salesforce.submitFormData(
                        salesforceFormData
                    );

                    /**
                     * @TODO: Determine file uploads to attach to record after submission
                     * recordId is the value returned by submitFormData on success
                     */
                    /*
                        await salesforce.contentVersion({
                          recordId: recordId,
                          // Some standard name for the file, not the original filename
                          attachmentName: 'bank-statement.pdf',
                          file: fileStream
                        });
                    */
                } else {
                    debug(`skipped salesforce submission for ${formId}`);
                }

                /**
                 * Create a submitted application from pending state
                 * SubmittedApplication holds a snapshot at the time of submission,
                 * allowing submissions to be rendered separate to form model changes.
                 */
                await SubmittedApplication.createFromPendingApplication({
                    pendingApplication: currentApplication,
                    form: form,
                    userId: req.user.userData.id,
                    formId: formId,
                    salesforceRecord: {
                        id: salesforceId,
                        submission: salesforceFormData
                    }
                });

                /**
                 * Delete the pending application once the
                 * SubmittedApplication has been created.
                 */
                await PendingApplication.deleteApplication(
                    currentApplication.id,
                    req.user.userData.id
                );

                /**
                 * Render confirmation
                 */
                unsetCurrentlyEditingId(req, function() {
                    const confirmation = confirmationBuilder({
                        locale: 'en',
                        data: currentApplicationData
                    });

                    res.render(
                        path.resolve(__dirname, './views/confirmation'),
                        {
                            title: confirmation.title,
                            confirmation: confirmation,
                            form: form
                        }
                    );
                });
            } catch (error) {
                // @TODO: Redirect to custom /error rather than passing to default handler?
                next(error);
            }
        } else {
            res.redirect(req.baseUrl);
        }
    });

    /**
     * Routes: Form steps
     */
    router.use('/', require('./steps')(formBuilder));

    return router;
}

module.exports = {
    initFormRouter
};
