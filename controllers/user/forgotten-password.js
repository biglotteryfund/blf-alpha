'use strict';
const path = require('path');
const jwt = require('jsonwebtoken');
const express = require('express');
const Raven = require('raven');
const Joi = require('joi');

const { getAbsoluteUrl } = require('../../modules/urls');
const { JWT_SIGNING_TOKEN } = require('../../modules/secrets');
const { requireUnauthed } = require('../../middleware/authed');
const { sendEmail } = require('../../services/mail');
const userService = require('../../services/user');
const normaliseErrors = require('./lib/normalise-errors');
const schema = require('./schema');

const router = express.Router();

async function processResetRequest(req, res, user) {
    const payload = { data: { userId: user.id, reason: 'resetpassword' } };
    const token = jwt.sign(payload, JWT_SIGNING_TOKEN, {
        expiresIn: '1h' // Short-lived token
    });

    const resetUrl = getAbsoluteUrl(req, `/user/reset-password/?token=${token}`);

    await sendEmail({
        name: 'user_password_reset',
        mailConfig: {
            sendTo: user.username,
            subject: 'Reset the password for your The National Lottery Community Fund website account',
            content: `Please click the following link to reset your password: ${resetUrl}`,
            type: 'text'
        }
    });

    await userService.updateIsInPasswordReset({
        id: user.id
    });
}

function renderForm(req, res, data = null, errors = []) {
    res.render(path.resolve(__dirname, './views/forgotten-password'), {
        formValues: data,
        errors: errors
    });
}

router
    .route('/')
    .all(requireUnauthed)
    .get(renderForm)
    .post(async function(req, res) {
        const validationResult = Joi.object({
            username: schema.username
        }).validate(req.body, {
            abortEarly: false,
            stripUnknown: true
        });

        const errors = normaliseErrors({
            validationError: validationResult.error,
            errorMessages: schema.errorMessages,
            locale: req.i18n.getLocale()
        });

        if (errors.length > 0) {
            renderForm(req, res, validationResult.value, errors);
        } else {
            res.locals.alertMessage =
                'Password reset requested. If the email address entered is correct you will receive instructions via email.';

            try {
                const { username } = validationResult.value;
                const user = await userService.findByUsername(username);

                if (user) {
                    await processResetRequest(req, res, user);
                }

                renderForm(req, res);
            } catch (error) {
                Raven.captureException(error);
                renderForm(req, res);
            }
        }
    });

module.exports = router;
