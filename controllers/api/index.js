'use strict';
const express = require('express');
const Joi = require('@hapi/joi');
const Sentry = require('@sentry/node');
const { sendEmail } = require('../../common/mail');

const { sanitise } = require('../../common/sanitise');
const {
    Feedback,
    SurveyAnswer,
    PendingApplication,
    Users,
    ApplicationExpirations
} = require('../../db/models');
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

async function handleMonthExpiry(monthExpiryApplications) {
    try {
        // Fetch email addresses
        const applicationExpirationsData = [];
        const userIds = monthExpiryApplications.map(application => {
            applicationExpirationsData.push({
                applicationId: application.id,
                expirationType: 'ONE_MONTH_REMINDER'
            })
            return application.userId
        });

        const monthExpiryMailList = await Users.getUsernamesByUserIds(userIds);

        // Send Emails
        if (monthExpiryMailList.length > 0) {
            await sendEmail({
                name: 'application_expiry',
                mailConfig: {
                    sendTo: appData.isNotProduction ? process.env.APPLICATION_EXPIRY_EMAIL : monthExpiryMailList,
                    subject: 'Your Application is due to expire!',
                    type: 'html',
                    content: '<h1>Hello</h1>'
                },
                mailTransport: null
            });
        }

        // create ApplicationExpirations records
        if (applicationExpirationsData.length > 0) {
            await ApplicationExpirations.createBulkExpiryApplications(applicationExpirationsData);
        }

    } catch (err) {
        console.log(err);
    }
}

router.post('/applications/expiry', async (req, res) => {
    try {

        const [
            monthExpiryApplications,
            weekExpiryApplications,
            dayExpiryApplications,
            expiredApplications
        ] = await Promise.all([
            PendingApplication.findApplicationsByExpiry('15', '30'),
            PendingApplication.findApplicationsByExpiry('3', '14'),
            PendingApplication.findApplicationsByExpiry('1', '2'),
            PendingApplication.findApplicationsByExpiry('expired')
        ]);

        // Handle expired application
        // .ie. send emails + delete applications + update ApplicationExpirations table

        // Handle Monthly reminder
        handleMonthExpiry(monthExpiryApplications);

        // Handle Weekly/Daily reminder
        // .ie. send emails + update ApplicationExpirations record
    } catch (err) {
        console.log(err);
    }
});

module.exports = router;
