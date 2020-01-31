'use strict';
const express = require('express');
const config = require('config');
const enableExpiration = config.get('awardsForAll.enableExpiration');

const {
    ApplicationEmailQueue,
    PendingApplication
} = require('../../../db/models');

const appData = require('../../../common/appData');
const {
    EMAIL_EXPIRY_TEST_ADDRESS,
    EMAIL_EXPIRY_SECRET,
    JWT_SIGNING_TOKEN
} = require('../../../common/secrets');

const logger = require('../../../common/logger').child({
    service: 'application-expiry'
});

const sendExpiryEmail = require('./send-expiry-email');

const router = express.Router();

function signUnsubscribeToken(applicationId) {
    return jwt.sign(
        {
            data: {
                applicationId: applicationId,
                action: 'unsubscribe'
            }
        },
        JWT_SIGNING_TOKEN,
        { expiresIn: '30d' }
    );
}

/**
 * Email Queue Handler:
 * Checks whether environment variable exists
 * Calculates time-to-finish-application value
 * Iterate through emailQueue, within which it:
 * -- Sends email
 * -- Updates db
 * returns an array of objects containing emailSent, dbUpdated for each queue
 */
async function sendExpiryEmails(req, emailQueue) {
    logger.info('Handling email queue');

    if (appData.isNotProduction && !EMAIL_EXPIRY_TEST_ADDRESS) {
        throw new Error('Missing secret EMAIL_EXPIRY_TEST_ADDRESS');
    }

    return await Promise.all(
        emailQueue.map(async emailToSend => {
            const { emailType, PendingApplication } = emailToSend;

            const emailStatus = await sendExpiryEmail({
                emailType: emailType,
                unsubscribeToken: signUnsubscribeToken(PendingApplication.id),
                formId: PendingApplication.formId,
                applicationId: PendingApplication.id,
                applicationData: PendingApplication.applicationData,
                expiresAt: PendingApplication.expiresAt,
                username: PendingApplication.user.username
            });

            if (emailStatus.response || appData.isTestServer) {
                if (enableExpiration) {
                    const queueStatus = await ApplicationEmailQueue.updateStatusToSent(
                        emailToSend.id
                    );

                    return {
                        emailSent: true,
                        dbUpdated: queueStatus[0] === 1
                    };
                } else {
                    /**
                     * Simulate a successful response but
                     * indicate no deletions were made
                     */
                    return {
                        emailSent: true,
                        dbUpdated: true,
                        wasSimulated: true
                    };
                }
            } else {
                return { emailSent: false, dbUpdated: false };
            }
        })
    );
}

/**
 * Handle expired applications:
 * Deletes all expired applications
 * DELETE promise returns number of records affected directly
 * returns truthy only if no. of del records = no. of expired applications
 */
async function deleteExpiredApplications(expiredApplications) {
    try {
        logger.info('Handling expired applications');

        if (enableExpiration) {
            const ids = expiredApplications.map(application => application.id);

            const dbStatus = await PendingApplication.deleteBatch(ids);

            const status = expiredApplications.map(application => {
                logger.info(`Deleting expired application`, {
                    formId: application.formId,
                    applicationStatus: application.currentProgressState
                });
                return {
                    applicationDeleted: true
                };
            });

            return dbStatus === expiredApplications.length ? status : false;
        } else {
            logger.info(
                `Simulated deleting ${expiredApplications.length} expired applications`
            );
            return true;
        }
    } catch (err) {
        logger.error('Error handling expired applications: ', err);
        return { error: err.message };
    }
}

/**
 * API: Application Expiry handler
 *
 * Emails users with pending expirations and deletes applications which have expired
 */
router.post('/', async (req, res) => {
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
            response.emailQueue = await sendExpiryEmails(req, emailQueue);
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
