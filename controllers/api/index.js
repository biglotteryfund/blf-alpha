'use strict';
const express = require('express');
const Joi = require('@hapi/joi');
const Sentry = require('@sentry/node');

const sanitise = require('../../common/sanitise');
const { Feedback, SurveyAnswer } = require('../../db/models');
const appData = require('../../common/appData');
const { POSTCODES_API_KEY } = require('../../common/secrets');
const { csrfProtection } = require('../../middleware/cached');

const idealPostcodes = require('ideal-postcodes')(POSTCODES_API_KEY);

const router = express.Router();

if (appData.isNotProduction) {
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

        idealPostcodes.lookupPostcode(query, (error, addresses) => {
            if (error) {
                Sentry.captureException(error);
                return makeError({
                    title: 'Connection error',
                    detail: 'Failed to get data from API'
                });
            } else {
                return res.json({ addresses });
            }
        });
    });
}

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

module.exports = router;
