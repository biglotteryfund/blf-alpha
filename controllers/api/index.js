'use strict';
const express = require('express');
const Joi = require('joi');

const router = express.Router();

const feedbackService = require('../../services/feedback');
const surveyService = require('../../services/surveys');

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
