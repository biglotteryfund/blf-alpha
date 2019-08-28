'use strict';
const express = require('express');
const Joi = require('@hapi/joi');
const Sentry = require('@sentry/node');
const moment = require('moment');

const { sanitise } = require('../../common/sanitise');
const { Feedback, SurveyAnswer, PendingApplication } = require('../../db/models');
const appData = require('../../common/appData');
const { POSTCODES_API_KEY } = require('../../common/secrets');
const { csrfProtection } = require('../../middleware/cached');

const { Client } = require('@ideal-postcodes/core-node');
const postcodesClient = new Client({
    api_key: POSTCODES_API_KEY
});

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
    const schema = Joi.object({
        description: Joi.string().required(),
        message: Joi.string().required()
    });

    const validationResult = schema.validate(req.body, {
        abortEarly: false,
        stripUnknown: true
    });

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
    const schema = Joi.object({
        choice: Joi.string()
            .valid(['yes', 'no'])
            .required(),
        path: Joi.string().required(),
        message: Joi.string().optional()
    });

    const validationResult = schema.validate(req.body, {
        abortEarly: false,
        stripUnknown: true
    });

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
router.post('/applications/expiry', async (req, res) => {
    try {
        const expiryApplications = await PendingApplication.findApplicationsByExpiry();
        const expiredReminderUserIds = [],
        dayReminderUserIds = [],
        weekReminderUserIds = [],
        monthReminderUserIds = [],
        expiredApplicationIds = [];
        
        expiryApplications.forEach((application) => {
            const expiryInDays = Math.abs(moment(application.expiresAt).diff(moment(), 'days'));

            // Collect userIds for each expiry scenarios
            // Collect application ids to delete the records later
            switch(true) {
                case (expiryInDays <= 0):
                    expiredApplicationIds.push(application.id);
                    expiredReminderUserIds.push(application.userId);
                    break;
                case (expiryInDays > 0 && expiryInDays <= 2):
                    dayReminderUserIds.push(application.userId);
                    break;
                case (expiryInDays > 2 && expiryInDays <= 14):
                    weekReminderUserIds.push(application.userId);
                    break;
                case (expiryInDays > 14 && expiryInDays <= 30):
                    monthReminderUserIds.push(application.userId);
                    break;
            }
        });

        // Handle expired application
        // .ie. send emails + delete applications + update ApplicationExpirations table

        // Handle Monthly reminder
        // .ie. send emails + create ApplicationExpirations record

        // Handle Weekly/Daily reminder
        // .ie. send emails + update ApplicationExpirations record
    } catch (err) {
        console.log(err);
    }
});

module.exports = router;
