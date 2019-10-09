'use strict';
const express = require('express');
const path = require('path');
const { get, includes } = require('lodash');
const { Op } = require('sequelize');

const {
    verifyTokenUnsubscribeApplicationEmails
} = require('./form-router-next/lib/jwt');
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

const logger = commonLogger.child({
    service: 'application-expiry'
});

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
            logger.info('User unsubscribed from application expiry emails');
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
            logger.warn('Email unsubscribe token failed', {
                token: req.query.token
            });
            res.redirect(req.baseUrl);
        }
    } else {
        res.redirect(req.baseUrl);
    }
});

// Cleanup applications with outdated field names
router.post('/migrate-data', async (req, res) => {
    if (req.body.secret !== EMAIL_EXPIRY_SECRET) {
        return res.status(403).json({ error: 'Invalid secret' });
    }

    const replacements = [
        {
            from: 'east-dumbartonshire',
            to: 'east-dunbartonshire'
        },
        {
            from: 'orkney',
            to: 'orkney-islands'
        },
        {
            from: 'shetland',
            to: 'shetland-islands'
        },
        {
            from: 'west-dumbartonshire',
            to: 'west-dunbartonshire'
        },
        {
            from: 'highlands',
            to: 'highland'
        }
    ];

    const invalidRegionNames = replacements.map(_ => _.from);

    const applications = await PendingApplication.findAllByForm(
        'awards-for-all'
    );

    const appsToUpdate = applications.filter(app => {
        return includes(
            invalidRegionNames,
            get(app.applicationData, 'projectLocation')
        );
    });

    appsToUpdate.map(async app => {
        app.applicationData.projectLocation = replacements.find(
            _ => _.from === app.applicationData.projectLocation
        ).to;
        return app.update(
            {
                applicationData: app.applicationData
            },
            { where: { id: { [Op.eq]: app.id } } }
        );
    });

    res.send({
        totalApps: applications.length,
        toUpdate: appsToUpdate.length
    });
});

/**
 * API: Application Expiry seeder
 */

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

        logger.info('application expiries processed', {
            emailsSent: response.emailQueue.length,
            expiredAppsDeleted: response.expired.length
        });

        res.json(response);
    } catch (error) {
        res.status(400).json({
            err: error.message
        });
    }
});

module.exports = router;
