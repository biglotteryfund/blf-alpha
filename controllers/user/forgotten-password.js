'use strict';
const path = require('path');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator/check');
const express = require('express');
const Raven = require('raven');

const { getAbsoluteUrl } = require('../../modules/urls');
const { JWT_SIGNING_TOKEN } = require('../../modules/secrets');
const { purifyUserInput } = require('../../modules/validators');
const { requireUnauthed } = require('../../middleware/authed');
const { sendEmail } = require('../../services/mail');
const { validators } = require('./helpers');
const userService = require('../../services/user');

const router = express.Router();

function renderRequestReset(req, res) {
    res.render(path.resolve(__dirname, './views/forgotten-password'), {
        errors: res.locals.errors || []
    });
}

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
            subject: 'Reset the password for your Big Lottery Fund website account',
            content: `Please click the following link to reset your password: ${resetUrl}`,
            type: 'text'
        }
    });

    await userService.updateIsInPasswordReset({
        id: user.id
    });
}

async function handleRequestReset(req, res) {
    const errors = validationResult(req);
    if (errors.isEmpty()) {
        res.locals.alertMessage =
            'Password reset requested. If the email address entered is correct you will receive instructions via email.';

        try {
            const email = purifyUserInput(req.body.username);
            const user = await userService.findByUsername(email);

            if (user) {
                await processResetRequest(req, res, user);
            }

            renderRequestReset(req, res);
        } catch (error) {
            Raven.captureException(error);
            renderRequestReset(req, res);
        }
    } else {
        // Failed validation
        res.locals.errors = errors.array();
        res.locals.formValues = req.body;
        return renderRequestReset(req, res);
    }
}

router
    .route('/')
    .all(requireUnauthed)
    .get(renderRequestReset)
    .post(validators.emailAddress, handleRequestReset);

module.exports = router;
