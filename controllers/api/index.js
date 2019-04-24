'use strict';
const express = require('express');
const request = require('request-promise-native');
const Joi = require('joi');
const Raven = require('raven');

const feedbackService = require('../../services/feedback');
const surveyService = require('../../services/surveys');
const appData = require('../../modules/appData');

const router = express.Router();

if (appData.isNotProduction) {
    /**
     * API: UK address lookup proxy
     * @TODO: Connect direct to service rather than via legacy domain
     */
    const addressLookupEndpoint = 'https://apply.tnlcommunityfund.org.uk/AddressFinder.ashx';
    router.get('/address-lookup', async (req, res) => {
        if (req.query.q) {
            try {
                const data = await request({
                    url: addressLookupEndpoint,
                    json: true,
                    qs: { Query: req.query.q }
                });
                res.json({ data });
            } catch (error) {
                Raven.captureException(error);
                res.status(400).json({
                    errors: [{ status: '400', title: 'Connection error' }]
                });
            }
        } else {
            res.status(400).json({
                errors: [
                    {
                        status: '400',
                        title: 'Invalid query parmater',
                        detail: 'Must include q paramter',
                        source: { parameter: 'q' }
                    }
                ]
            });
        }
    });

    router.get('/address-lookup/:moniker', async (req, res) => {
        try {
            const [data] = await request({
                url: addressLookupEndpoint,
                json: true,
                qs: { GetAddress: 1, Moniker: req.params.moniker }
            });

            res.json({ data });
        } catch (error) {
            Raven.captureException(error);
            res.status(400).json({
                errors: [{ status: '400', title: 'Connection error' }]
            });
        }
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
            const result = await feedbackService.storeFeedback({
                description: validationResult.value.description,
                message: validationResult.value.message
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
            const result = await surveyService.createResponse({
                choice: validationResult.value.choice,
                path: validationResult.value.path,
                message: validationResult.value.message
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
