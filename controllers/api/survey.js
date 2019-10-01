'use strict';
const express = require('express');

const { SurveyAnswer } = require('../../db/models');
const { sanitise } = require('../../common/sanitise');
const validateSurvey = require('./lib/validate-survey');

const router = express.Router();

/**
 * API: Survey endpoint
 */
router.post('/', async (req, res) => {
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

module.exports = router;
