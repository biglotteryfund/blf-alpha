'use strict';
const express = require('express');
const csurf = require('csurf');
const path = require('path');
const Sentry = require('@sentry/node');
const flatMap = require('lodash/flatMap');
const get = require('lodash/get');
const includes = require('lodash/includes');
const isEmpty = require('lodash/isEmpty');
const pick = require('lodash/pick');
const set = require('lodash/set');
const unset = require('lodash/unset');
const features = require('config').get('features');
const formidable = require('formidable');

const {
    PendingApplication,
    SubmittedApplication
} = require('../../../db/models');

const commonLogger = require('../../../common/logger');
const appData = require('../../../common/appData');
const { localify } = require('../../../common/urls');
const { noStore } = require('../../../middleware/cached');
const { requireActiveUser } = require('../../../middleware/authed');
const { injectCopy } = require('../../../middleware/inject-content');

const salesforceService = require('./lib/salesforce');
const {
    getObject,
    buildMultipartData,
    checkAntiVirus
} = require('./lib/file-uploads');

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
        res.locals.formId = formId;
        res.locals.formBaseUrl = req.baseUrl;
        res.locals.breadcrumbs = [{ label: form.title, url: req.baseUrl }];

        res.locals.user = req.user;
        res.locals.isBilingual = form.isBilingual;
        res.locals.enableSiteSurvey = false;
        res.locals.bodyClass = 'has-static-header'; // No hero images on apply pages

        // @TODO i18n
        res.locals.userNavigationLinks = [
            {
                url: `${req.baseUrl}/summary`,
                label: 'Summary'
            },
            {
                url: req.baseUrl,
                label: 'Applications'
            },
            {
                url: localify(req.i18n.getLocale())('/user'),
                label: 'Account'
            },
            {
                url: localify(req.i18n.getLocale())('/user/logout'),
                label: 'Log out'
            }
        ];

        next();
    }

    /**
     * Decide if we need to handle multipart/form-data
     * Populate req.body for multipart forms before CSRF token is needed
     */
    function handleMultipartFormData(req, res, next) {
        function needsMultipart() {
            const contentType = req.headers['content-type'];
            return (
                req.method === 'POST' &&
                contentType &&
                contentType.includes('multipart/form-data')
            );
        }

        if (needsMultipart()) {
            const formData = new formidable.IncomingForm();
            formData
                .parse(req, (err, fields, files) => {
                    if (err) {
                        next(err);
                    } else {
                        req.body = fields;
                        req.files = files;
                        next();
                    }
                })
                .on('error', err => {
                    next(err);
                });
        } else {
            next();
        }
    }

    /**
     * Common router middleware
     * Require active user past this point
     */
    router.use(
        noStore,
        requireActiveUser,
        handleMultipartFormData,
        injectCopy('applyNext'),
        setCommonLocals,
        csurf()
    );

    /**
     * Route: Dashboard
     */
    router.use('/', require('./dashboard')(formId, formBuilder));

    /**
     * Route: Questions list
     */
    router.use(
        '/questions',
        require('./questions')(formId, formBuilder, eligibilityBuilder)
    );

    /**
     * Route: Eligibility
     */
    router.use(
        '/eligibility',
        require('./eligibility')(eligibilityBuilder, formId)
    );

    /**
     * Route: Start application
     * Redirect to eligibility checker
     */
    router.get('/start', function(req, res) {
        res.redirect(`${req.baseUrl}/eligibility/1`);
    });

    /**
     * Route: New application
     * Create a new blank application
     */
    router.get('/new', async function(req, res, next) {
        try {
            const application = await PendingApplication.createNewApplication({
                formId: formId,
                userId: req.user.userData.id
            });

            setCurrentlyEditingId(req, application.id);
            req.session.save(() => {
                res.redirect(`${req.baseUrl}/summary`);
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
     * Help pages
     * Used to render support pages for this application
     */
    router.get('/help/:helpItem', function(req, res) {
        const helpItems = ['bank-statement'];
        if (!includes(helpItems, req.params.helpItem)) {
            res.redirect(req.baseUrl);
        }

        let title;
        switch (req.params.helpItem) {
            case 'bank-statement':
                title = 'Help with your bank statement';
                break;
            default:
                title = res.locals.formTitle;
                break;
        }

        res.render(path.resolve(__dirname, './views/help-item'), {
            title: title,
            item: req.params.helpItem
        });
    });

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
    router.use('/summary', require('./summary')(formBuilder));

    /**
     * Route: Submission
     */
    router.post('/submission', async (req, res, next) => {
        const { currentApplication, currentApplicationData } = res.locals;

        const logger = commonLogger.child({
            service: 'salesforce'
        });

        function canSubmit() {
            return isEmpty(currentApplication) === false;
        }

        function canSubmitToSalesforce() {
            if (appData.isTestServer) {
                return false;
            } else {
                return features.enableSalesforceConnector;
            }
        }

        if (canSubmit() === true) {
            const form = formBuilder({
                locale: req.i18n.getLocale(),
                data: currentApplicationData
            });

            // Extract the fields so we can determine which files to upload to Salesforce
            const steps = flatMap(form.sections, 'steps');
            const fieldsets = flatMap(steps, 'fieldsets');
            const fields = flatMap(fieldsets, 'fields');

            try {
                logger.info('Submission started');
                let fileUploadError = false;

                /**
                 * Increment submission attempts
                 * Allows us to report on failed submission attempts.
                 */
                await currentApplication.increment('submissionAttempts');

                /**
                 * Construct salesforce submission data
                 * We also attach this to the SubmittedApplication record
                 */
                let salesforceRecordId = null;
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
                    salesforceRecordId = await salesforce.submitFormData(
                        salesforceFormData
                    );

                    logger.info('FormData record created');

                    /**
                     * Upload each file in the submission to salesforce
                     */
                    const contentVersionPromises = fields
                        .filter(field => field.type === 'file')
                        .map(async field => {
                            const pathConfig = {
                                formId: formId,
                                applicationId: currentApplication.id,
                                filename: field.value.filename
                            };

                            try {
                                await checkAntiVirus(pathConfig);
                            } catch (err) {
                                // We caught a suspect file
                                fileUploadError = err.message;
                                return;
                            }

                            return buildMultipartData(pathConfig).then(
                                versionData => {
                                    return salesforce.contentVersion({
                                        recordId: salesforceRecordId,
                                        attachmentName: `${
                                            field.name
                                        }${path.extname(field.value.filename)}`,
                                        versionData: versionData
                                    });
                                }
                            );
                        });

                    await Promise.all(contentVersionPromises);
                    logger.info('File uploads attached to FormData record');
                } else {
                    logger.debug(`Skipped salesforce submission for ${formId}`);
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
                        id: salesforceRecordId,
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
                        data: currentApplicationData,
                        fileUploadError: fileUploadError
                    });

                    logger.info('Submission successful');
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
                logger.error('Submission failed');

                /**
                 * Salesforce submission failed,
                 * Check the instance status and log if not OK,
                 * allows us to monitor how many applications get submitted during
                 * maintenance windows to determine if we need some visible messaging.
                 */
                try {
                    const response = await salesforceService.checkStatus();

                    if (response.status !== 'OK') {
                        logger.info(`Salesforce status ${response.status}`);
                    }

                    next(error);
                } catch (statusError) {
                    next(error);
                }
            }
        } else {
            res.redirect(req.baseUrl);
        }
    });

    /**
     * Routes: Stream file from S3 if authorised
     * Stream the file's headers and serve it directly as a response
     * @see https://stackoverflow.com/a/43356401
     */
    router
        .route('/download/:fieldName/:filename')
        .get(async (req, res, next) => {
            const { currentlyEditingId, currentApplicationData } = res.locals;

            const fileData = currentApplicationData[req.params.fieldName];
            const matchesField =
                fileData && fileData.filename === req.params.filename;

            if (matchesField) {
                const pathConfig = {
                    formId: formId,
                    applicationId: currentlyEditingId,
                    filename: req.params.filename
                };

                try {
                    await checkAntiVirus(pathConfig);
                    getObject(pathConfig)
                        .on('httpHeaders', (code, headers) => {
                            res.status(code);
                            if (code < 300) {
                                res.set(
                                    pick(
                                        headers,
                                        'content-type',
                                        'content-length',
                                        'last-modified'
                                    )
                                );
                            }
                        })
                        .createReadStream()
                        .on('error', next)
                        .pipe(res);
                } catch (err) {
                    let userMessage;
                    switch (err.message) {
                        case 'ERR_FILE_SCAN_INFECTED':
                            userMessage =
                                'This file has been blocked for security reasons.';
                            break;
                        case 'ERR_FILE_SCAN_UNKNOWN':
                            userMessage =
                                'This file is still being scanned for security risks - please check back shortly.';
                            break;
                        default:
                            userMessage =
                                'There was an issue retrieving your file - please try again soon.';
                            break;
                    }
                    return res.send(userMessage);
                }
            } else {
                next();
            }
        });

    /**
     * Routes: Form steps
     */
    router.use('/', require('./steps')(formId, formBuilder));

    return router;
}

module.exports = {
    initFormRouter
};
