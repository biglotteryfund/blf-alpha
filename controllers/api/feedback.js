'use strict';
const express = require('express');

const { sanitise } = require('../../common/sanitise');
const { Feedback } = require('../../db/models');

const validateFeedback = require('./lib/validate-feedback');

const router = express.Router();

router.post('/', async (req, res) => {
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

module.exports = router;
