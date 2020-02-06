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

const logger = require('../../../common/logger').child({ service: 'apply' });
const { localify, isWelsh, removeWelsh } = require('../../../common/urls');
const { noStore } = require('../../../common/cached');
const { requireActiveUserWithCallback } = require('../../../common/authed');
const generateExpiryQueue = require('../expiries/generate-expiry-queue');

const { getObject } = require('./lib/file-uploads');
const { getShortId } = require('./lib/hotjar');

function initFormRouter({
    formId,
    formBuilder,
    startTemplate = null,
    eligibilityBuilder = null,
    confirmationBuilder,
    transformFunction = null,
    expiryEmailPeriods = null,
    isBilingual = true
}) {
    const router = express.Router();

    function currentlyEditingSessionKey() {
        return `forms.${formId}.currentEditingId`;
    }

    function redirectWelsh(req, res, next) {
        if (isBilingual === false && isWelsh(req.originalUrl)) {
            return res.redirect(removeWelsh(req.originalUrl));
        } else {
            next();
        }
    }

    function setCommonLocals(req, res, next) {
        res.locals.copy = req.i18n.__('applyNext');
        res.locals.isBilingual = isBilingual;

        const form = formBuilder({
            locale: req.i18n.getLocale()
        });

        res.locals.formTitle = form.title;
        res.locals.formId = formId;
        res.locals.formShortId = getShortId(formId);
        res.locals.formBaseUrl = req.baseUrl;

        next();
    }

    /**
     * Common router middleware
     */
    router.use(noStore, redirectWelsh, setCommonLocals);

    router.get('/start', function(req, res) {
        const nextPageUrl = eligibilityBuilder
            ? `${req.baseUrl}/eligibility/1`
            : `${req.baseUrl}/new`;

        if (startTemplate) {
            res.render(startTemplate, {
                nextPageUrl: nextPageUrl
            });
        } else {
            res.redirect(nextPageUrl);
        }
    });

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
                await ApplicationEmailQueue.createNewQueue(
                    generateExpiryQueue(application, expiryEmailPeriods)
                );
            }

            res.json(application);
        });
    }

    /**
     * Decide if we need to handle multipart/form-data
     * Populate req.body for multipart forms before CSRF token is needed
     */
    function handleMultipart(req, res, next) {
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

    function setUserLocals(req, res, next) {
        res.locals.user = req.user;
        res.locals.userNavigationLinks = [
            {
                url: `${req.baseUrl}/summary`,
                label: req.i18n.__('applyNext.navigation.summary')
            },
            {
                url: res.locals.sectionUrl,
                label: req.i18n.__('applyNext.navigation.latestApplication')
            },
            {
                url: `${res.locals.sectionUrl}/all`,
                label: req.i18n.__('applyNext.navigation.allApplications')
            },
            {
                url: localify(req.i18n.getLocale())('/user'),
                label: req.i18n.__('applyNext.navigation.account')
            }
        ];

        next();
    }

    /**
     * Require active user past this point
     */
    router.use(
        requireActiveUserWithCallback(req => {
            // Track attempts to submit form steps when session is expired/invalid
            if (req.method === 'POST') {
                logger.info('User submitted POST data without valid session', {
                    formId: formId,
                    url: req.originalUrl
                });
            }
        }),
        handleMultipart,
        setUserLocals,
        csurf()
    );

    /**
     * Route: Redirect to apply dashboard
     */
    router.get('/', function(req, res) {
        res.redirect(res.locals.sectionUrl);
    });

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
                await ApplicationEmailQueue.createNewQueue(
                    generateExpiryQueue(application, expiryEmailPeriods)
                );
            }

            logger.info('Application created', { formId });

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
        if (req.query.s === 'expiryEmail') {
            logger.info('User clicked edit link on expiry email', { formId });
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
                const currentApplication = await PendingApplication.findForUser(
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

                    res.locals.currentApplicationData = transformFunction
                        ? transformFunction(currentApplicationData)
                        : currentApplicationData;

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
     * Block access to expired applications
     * We should prevent access to anything that's pending deletion to avoid user confusion and lost data
     */
    router.use((req, res, next) => {
        if (res.locals.currentApplication.isExpired) {
            return res.render(path.resolve(__dirname, './views/expired'), {
                title: res.locals.copy.expired.title,
                csrfToken: req.csrfToken()
            });
        } else {
            next();
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
            currentlyEditingSessionKey
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
