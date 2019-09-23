'use strict';
const express = require('express');
const Sentry = require('@sentry/node');
const moment = require('moment');

const { Op, Sequelize } = require('sequelize');

const { sanitise } = require('../../common/sanitise');
const {
    Feedback,
    SurveyAnswer,
    PendingApplication,
    EmailQueue,
    Users
} = require('../../db/models');
const appData = require('../../common/appData');
const { POSTCODES_API_KEY } = require('../../common/secrets');
const { csrfProtection } = require('../../common/cached');
const { handleEmailQueue, handleExpired } = require('./lib/application-expiry');

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

// Create expiry records for these applications
router.get('/applications/expiry/seed', async (req, res) => {
    // Expire a bunch of applications and set their user ID to a fake one
    const allApps = await PendingApplication.findAllByForm('awards-for-all');
    allApps.forEach(async application => {
        const newExpiryDate = moment(application.expiresAt).subtract(
            1,
            'month'
        );
        await EmailQueue.createNewQueue(application.id, application.expiresAt);
        application.update({
            expiresAt: newExpiryDate,
            userId: 1
        });
    });
    res.send(allApps);
});

router.get('/applications/expiry', async (req, res) => {
    try {
        const data = await EmailQueue.findAll({
            where: {
                status: { [Op.eq]: 'NOT_SENT' },
                [Op.and]: [
                    Sequelize.where(
                        Sequelize.fn(
                            'datediff',
                            Sequelize.col('dateToSend'),
                            Sequelize.fn('NOW')
                        ),
                        {
                            [Op.lte]: 0
                        }
                    )
                ]
            },
            include: [
                {
                    model: PendingApplication,
                    include: [
                        {
                            model: Users
                        }
                    ]
                }
            ]
        });
        res.send(data);
    } catch (err) {
        console.log(err);
        res.send(err);
    }
});

router.post('/applications/expiry', async (req, res) => {
    try {
        let response = {};

        const [emailQueue, expiredApplications] = await Promise.all([
            EmailQueue.getEmailsToSend(),
            PendingApplication.findExpired()
        ]);

        if (emailQueue.length > 0) {
            response.emailQueue = await handleEmailQueue(emailQueue);
        } else {
            response.emailQueue = 'No applications were found';
        }

        if (expiredApplications.length > 0) {
            response.expired = await handleExpired(expiredApplications);
        } else {
            response.expired = 'No applications were found';
        }

        res.json(response);
    } catch (error) {
        res.status(400).json({
            err: error.message
        });
    }
});

module.exports = router;
