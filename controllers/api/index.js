'use strict';
const config = require('config');
const moment = require('moment');
const express = require('express');

const { pick } = require('lodash');
const { body, validationResult } = require('express-validator/check');
const { matchedData } = require('express-validator/filter');

const { FORM_STATES } = require('../../modules/forms');
const { purifyUserInput } = require('../../modules/validators');
const feedbackService = require('../../services/feedback');
const surveyService = require('../../services/surveys');

const router = express.Router();

router.post('/survey', [
    body('choice')
        .exists()
        .not()
        .isEmpty()
        .isIn(['yes', 'no'])
        .withMessage('Please supply a valid choice'),
    body('path').exists()
], async (req, res) => {
    const errors = validationResult(req);

    if (errors.isEmpty()) {
        for (let key in req.body) {
            req.body[key] = purifyUserInput(req.body[key]);
        }

        try {
            const responseData = pick(req.body, ['choice', 'path', 'message']);
            const result = await surveyService.createResponse(responseData);
            res.send({
                status: 'success',
                result: result
            });
        } catch (err) {
            res.status(400).send({
                status: 'error',
                err: err
            });
        }
    } else {
        res.status(400).send({
            status: 'error',
            err: errors.array()
        });
    }
});

router.post('/feedback', [
    body('description')
        .exists()
        .not()
        .isEmpty(),
    body('message')
        .exists()
        .not()
        .isEmpty()
], (req, res) => {
    const formErrors = validationResult(req);
    const formData = matchedData(req);
    const messageSuccess = req.i18n.__('global.feedback.success');
    const messageError = req.i18n.__('global.feedback.error');

    if (formErrors.isEmpty()) {
        feedbackService
            .storeFeedback({
                description: formData['description'],
                message: formData['message']
            })
            .then(() => {
                res.json({
                    status: FORM_STATES.SUBMISSION_SUCCESS,
                    message: messageSuccess,
                    data: formData
                });
            })
            .catch(err => {
                res.status(400).json({
                    status: FORM_STATES.SUBMISSION_ERROR,
                    message: messageError,
                    err: err
                });
            });
    } else {
        res.status(400).json({
            status: FORM_STATES.VALIDATION_ERROR,
            message: messageError,
            err: 'Please supply all fields'
        });
    }
});

router.get('/contrast/:mode', (req, res) => {
    res.cacheControl = { maxAge: 1 };

    let cookieName = config.get('cookies.contrast');
    let duration = moment.duration(6, 'months').asMilliseconds();
    let redirectUrl = req.query.url || '/';
    if (req.params.mode === 'high') {
        res.cookie(cookieName, req.params.mode, {
            maxAge: duration,
            httpOnly: false
        });
    } else {
        res.clearCookie(cookieName);
    }
    res.redirect(redirectUrl);
});

module.exports = router;
