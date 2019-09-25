'use strict';
const express = require('express');
const Sentry = require('@sentry/node');
const concat = require('lodash/concat');

const { sanitise } = require('../../common/sanitise');
const {
    Feedback,
    SurveyAnswer,
    PendingApplication,
    ApplicationEmailQueue
} = require('../../db/models');
const appData = require('../../common/appData');
const {
    POSTCODES_API_KEY,
    EMAIL_EXPIRY_SECRET
} = require('../../common/secrets');
const { csrfProtection } = require('../../common/cached');
const {
    sendExpiryEmails,
    deleteExpiredApplications
} = require('./lib/application-expiry');

// @TODO remove this logic after seeding past application email queue
const { EXPIRY_EMAIL_REMINDERS } = require('../apply/awards-for-all/constants');
const {
    generateEmailQueueItems
} = require('../apply/form-router-next/lib/emailQueue');

const { Client } = require('@ideal-postcodes/core-node');
const postcodesClient = new Client({
    api_key: POSTCODES_API_KEY
});

const { validateFeedback, validateSurvey } = require('./schemas');

const router = express.Router();

/**
 * API: UK address lookup proxy
 */
router.post('/address-lookup', csrfProtection, async (req, res) => {
    const makeError = (title, detail, source = null) => {
        return res.status(400).json({
            errors: [
                {
                    status: 400,
                    title,
                    detail,
                    source
                }
            ]
        });
    };

    const query = req.body.q;

    if (!query) {
        return makeError({
            title: 'Invalid query parameter',
            detail: 'Must include q parameter',
            source: { parameter: 'q' }
        });
    }
    try {
        // Tag the postcode lookup with metadata
        const tags = [
            `ENV_${appData.environment}`,
            `BUILD_${appData.buildNumber}`
        ];
        const addresses = await postcodesClient.lookupPostcode({
            postcode: query,
            tags: tags
        });
        return res.json({ addresses });
    } catch (error) {
        Sentry.captureException(error);
        return makeError({
            title: 'Connection error',
            detail: 'Failed to get data from API'
        });
    }
});

/**
 * API: Feedback endpoint
 */
router.post('/feedback', async (req, res) => {
    const validationResult = validateFeedback(req.body);

    const messageSuccess = req.i18n.__('global.feedback.success');
    const messageError = req.i18n.__('global.feedback.error');

    if (validationResult.error) {
        res.status(400).json({
            status: 'error',
            message: messageError,
            err: validationResult.error.message
        });
    } else {
        try {
            const [result] = await Feedback.storeFeedback({
                description: validationResult.value.description,
                message: sanitise(validationResult.value.message)
            });

            res.json({
                status: 'success',
                message: messageSuccess,
                result: result
            });
        } catch (storeError) {
            res.status(400).json({
                status: 'error',
                message: messageError,
                err: storeError.message
            });
        }
    }
});

/**
 * API: Survey endpoint
 */
router.post('/survey', async (req, res) => {
    const validationResult = validateSurvey(req.body);

    if (validationResult.error) {
        res.status(400).json({
            status: 'error',
            err: validationResult.error.message
        });
    } else {
        try {
            const [result] = await SurveyAnswer.createResponse({
                choice: validationResult.value.choice,
                path: validationResult.value.path,
                message: sanitise(validationResult.value.message)
            });

            res.json({
                status: 'success',
                result: result
            });
        } catch (storeError) {
            res.status(400).json({
                status: 'error',
                err: storeError.message
            });
        }
    }
});

/**
 * API: Application Expiry
 */

// @TODO remove this endpoint after seeding past application email queue
router.post('/applications/expiry/seed', async (req, res) => {
    if (req.body.secret !== EMAIL_EXPIRY_SECRET && !appData.isTestServer) {
        return res.status(403).json({ error: 'Invalid secret' });
    }

    try {
        let emailQueueItems = [];

        const applications = await PendingApplication.findAllByForm(
            'awards-for-all'
        );

        applications.forEach(app => {
            emailQueueItems = concat(
                emailQueueItems,
                generateEmailQueueItems(app, EXPIRY_EMAIL_REMINDERS)
            );
        });

        if (emailQueueItems.length > 0) {
            // Clear out the existing email queue
            await ApplicationEmailQueue.destroy({
                truncate: true
            });
            await ApplicationEmailQueue.createNewQueue(emailQueueItems);

            res.json({
                status: 'ok',
                applicationsProcessed: applications.length,
                emailQueueItemsCreated: emailQueueItems.length
            });
        } else {
            return res(403).json({
                error: 'No application emails found to insert'
            });
        }
    } catch (error) {
        res.status(400).json({
            error: error.message
        });
    }
});

router.post('/applications/expiry', async (req, res) => {
    if (req.body.secret !== EMAIL_EXPIRY_SECRET && !appData.isTestServer) {
        return res.status(403).json({ error: 'Invalid secret' });
    }

    try {
        let response = {};

        const [emailQueue, expiredApplications] = await Promise.all([
            ApplicationEmailQueue.getEmailsToSend(),
            PendingApplication.findExpiredApplications()
        ]);

        if (emailQueue.length > 0) {
            response.emailQueue = await sendExpiryEmails(
                req,
                emailQueue,
                req.i18n.getLocale()
            );
        } else {
            response.emailQueue = [];
        }

        if (expiredApplications.length > 0) {
            response.expired = await deleteExpiredApplications(
                expiredApplications
            );
        } else {
            response.expired = [];
        }

        res.json(response);
    } catch (error) {
        res.status(400).json({
            err: error.message
        });
    }
});

module.exports = router;
