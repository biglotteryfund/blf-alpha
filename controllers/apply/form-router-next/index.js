'use strict';
const express = require('express');
const csurf = require('csurf');
const path = require('path');
const Sentry = require('@sentry/node');
const get = require('lodash/get');
const includes = require('lodash/includes');
const pick = require('lodash/pick');
const set = require('lodash/set');
const features = require('config').get('features');
const formidable = require('formidable');

const {
    PendingApplication,
    ApplicationEmailQueue
} = require('../../../db/models');

const commonLogger = require('../../../common/logger');
const { localify } = require('../../../common/urls');
const { noStore } = require('../../../common/cached');
const { requireActiveUserWithCallback } = require('../../../common/authed');
const { injectCopy } = require('../../../common/inject-content');

const { getObject } = require('./lib/file-uploads');
const { generateEmailQueueItems } = require('./lib/emailQueue');

function initFormRouter({
    formId,
    formBuilder,
    startTemplate = null,
    eligibilityBuilder = null,
    confirmationBuilder,
    enableSalesforceConnector = true,
    expiryEmailPeriods = null
}) {
    const router = express.Router();

    function currentlyEditingSessionKey() {
        return `forms.${formId}.currentEditingId`;
    }

    function setCommonLocals(req, res, next) {
        const form = formBuilder({
            locale: req.i18n.getLocale()
        });

        res.locals.formTitle = form.title;
        res.locals.formId = formId;
        res.locals.formBaseUrl = req.baseUrl;

        res.locals.user = req.user;
        res.locals.enableSiteSurvey = false;
        res.locals.bodyClass = 'has-static-header'; // No hero images on apply pages

        res.locals.userNavigationLinks = [
            {
                url: `${req.baseUrl}/summary`,
                label: res.locals.copy.navigation.summary
            },
            {
                url: req.baseUrl,
                label: res.locals.copy.navigation.applications
            },
            {
                url: localify(req.i18n.getLocale())('/user'),
                label: res.locals.copy.navigation.account
            },
            {
                url: localify(req.i18n.getLocale())('/user/logout'),
                label: res.locals.copy.navigation.logOut
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
     * Application seed endpoint
     * Allows generation of seed applications in test environments
     */
    if (features.enableSeeders) {
        router.post('/seed', async (req, res) => {
            const application = await PendingApplication.createNewApplication({
                formId: formId,
                userId: req.body.userId,
                customExpiry: req.body.expiresAt
            });

            if (expiryEmailPeriods) {
                const emailsToQueue = generateEmailQueueItems(
                    application,
                    expiryEmailPeriods
                );
                await ApplicationEmailQueue.createNewQueue(emailsToQueue);
            }

            res.json(application);
        });
    }

    /**
     * Common router middleware
     * Require active user past this point
     */
    router.use(
        noStore,
        requireActiveUserWithCallback(req => {
            // Track attempts to submit form steps when session is expired/invalid
            if (req.method === 'POST') {
                commonLogger.info(
                    'User submitted POST data without valid session',
                    {
                        service: 'apply',
                        formId: formId
                    }
                );
            }
        }),
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
    if (eligibilityBuilder) {
        router.use(
            '/eligibility',
            require('./eligibility')(eligibilityBuilder, formId)
        );
    }

    /**
     * Route: Start application
     * Redirect to eligibility checker
     */
    router.get('/start', function(req, res) {
        const newUrl = `${req.baseUrl}/new`;
        if (eligibilityBuilder) {
            res.redirect(`${req.baseUrl}/eligibility/1`);
        } else if (startTemplate) {
            res.render(startTemplate, {
                backUrl: req.baseUrl,
                newUrl
            });
        } else {
            res.redirect(newUrl);
        }
    });

    function redirectCurrentlyEditing(req, res, applicationId) {
        set(req.session, currentlyEditingSessionKey(), applicationId);
        req.session.save(() => {
            res.redirect(`${req.baseUrl}/summary`);
        });
    }

    /**
     * Route: New application
     */
    router.get('/new', async function(req, res, next) {
        try {
            const application = await PendingApplication.createNewApplication({
                formId: formId,
                userId: req.user.userData.id
            });

            if (expiryEmailPeriods) {
                // Convert this application's expiry periods into a set of queue items
                const emailsToQueue = generateEmailQueueItems(
                    application,
                    expiryEmailPeriods
                );
                await ApplicationEmailQueue.createNewQueue(emailsToQueue);
            }

            commonLogger.info('Application created', {
                service: 'apply',
                formId: formId
            });

            redirectCurrentlyEditing(req, res, application.id);
        } catch (error) {
            next(error);
        }
    });

    /**
     * Route: Edit application
     */
    router.get('/edit/:applicationId', function(req, res) {
        // If this link includes a source (s) parameter, track it
        // eg. to analyse usage of expiry reminder emails
        if (get(req.query, 's') === 'expiryEmail') {
            commonLogger.info('User clicked edit link on expiry email', {
                service: 'apply',
                formId: formId
            });
        }
        redirectCurrentlyEditing(req, res, req.params.applicationId);
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
                title = res.locals.copy.fields.bankStatement.help.title;
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
        const currentEditingId = get(req.session, currentlyEditingSessionKey());

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
    router.use(
        '/submission',
        require('./submission')(
            formId,
            formBuilder,
            confirmationBuilder,
            currentlyEditingSessionKey,
            enableSalesforceConnector
        )
    );

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
