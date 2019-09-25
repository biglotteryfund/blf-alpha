'use strict';
const express = require('express');
const concat = require('lodash/concat');
const path = require('path');

const { verifyTokenUnsubscribeApplicationEmails } = require('../user/lib/jwt');
const {
    ApplicationEmailQueue,
    PendingApplication
} = require('../../db/models');
const commonLogger = require('../../common/logger');
const { EMAIL_EXPIRY_SECRET } = require('../../common/secrets');
const appData = require('../../common/appData');
const {
    sendExpiryEmails,
    deleteExpiredApplications
} = require('./form-router-next/lib/application-expiry');

// @TODO remove this logic after seeding past application email queue
const { EXPIRY_EMAIL_REMINDERS } = require('./awards-for-all/constants');
const {
    generateEmailQueueItems
} = require('./form-router-next/lib/emailQueue');
const { isNotProduction } = require('../../common/appData');

const router = express.Router();

router.get('/', (req, res) => res.redirect('/'));

router.use('/your-idea', require('./reaching-communities'));
router.use('/awards-for-all', require('./awards-for-all'));

if (isNotProduction) {
    router.use('/get-advice', require('./get-advice'));
}

/**
 * Application email unsubscribe
 * Allows a user to remove any scheduled emails for them about an application
 */
router.get('/emails/unsubscribe', async function(req, res) {
    if (req.query.token) {
        try {
            const unsubscribeRequest = await verifyTokenUnsubscribeApplicationEmails(
                req.query.token
            );
            const applicationId = unsubscribeRequest.applicationId;
            // delete scheduled emails then redirect with message
            await ApplicationEmailQueue.deleteEmailsForApplication(
                applicationId
            );
            commonLogger.info(
                'User unsubscribed from application expiry emails'
            );
            res.render(
                path.resolve(
                    __dirname,
                    './form-router-next/views/unsubscribed'
                ),
                {
                    title: 'Unsubscription successful',
                    message: `We will no longer email you about your application's expiration.`
                }
            );
        } catch (error) {
            commonLogger.warn('Email unsubscribe token failed', {
                token: req.query.token
            });
            res.redirect(req.baseUrl);
        }
    } else {
        res.redirect(req.baseUrl);
    }
});

/**
 * API: Application Expiry seeder
 */

// @TODO remove this endpoint after seeding past application email queue
router.post('/handle-expiry/seed', async (req, res) => {
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

/**
 * API: Application Expiry handler
 *
 * Emails users with pending expirations and deletes applications which have expired
 */

router.post('/handle-expiry', async (req, res) => {
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
