'use strict';
const path = require('path');
const jwt = require('jsonwebtoken');
const express = require('express');
const Raven = require('raven');
const Joi = require('joi');

const { localify, getAbsoluteUrl } = require('../../modules/urls');
const { JWT_SIGNING_TOKEN } = require('../../modules/secrets');
const { normaliseErrors } = require('../../modules/errors');
const { requireUnauthed } = require('../../middleware/authed');
const { generateHtmlEmail, sendEmail } = require('../../services/mail');
const userService = require('../../services/user');
const schema = require('./schema');

const router = express.Router();

async function processResetRequest(req, res, user) {
    const payload = { data: { userId: user.id, reason: 'resetpassword' } };
    const token = jwt.sign(payload, JWT_SIGNING_TOKEN, {
        expiresIn: '1h' // Short-lived token
    });

    const emailHtml = await generateHtmlEmail({
        template: path.resolve(__dirname, './views/emails/forgotten-password.njk'),
        templateData: {
            locale: req.i18n.getLocale(),
            resetUrl: getAbsoluteUrl(req, `/user/password/reset?token=${token}`),
            email: user.username
        }
    });

    await sendEmail({
        name: 'user_password_reset',
        mailConfig: {
            sendTo: user.username,
            subject: 'Reset the password for your The National Lottery Community Fund website account',
            type: 'html',
            content: emailHtml
        }
    });

    await userService.updateIsInPasswordReset({
        id: user.id
    });
}

function renderForgotForm(req, res, data = null, errors = []) {
    res.render(path.resolve(__dirname, './views/forgotten-password'), {
        formValues: data,
        errors: errors
    });
}

router
    .route('/forgot')
    .all(requireUnauthed)
    .get(renderForgotForm)
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
            renderForgotForm(req, res, validationResult.value, errors);
        } else {
            res.locals.alertMessage =
                'Password reset requested. If the email address entered is correct you will receive instructions via email.';
            try {
                const { username } = validationResult.value;
                const user = await userService.findByUsername(username);

                if (user) {
                    await processResetRequest(req, res, user);
                    res.locals.passwordWasJustReset = true;
                }

                renderForgotForm(req, res);
            } catch (error) {
                Raven.captureException(error);
                renderForgotForm(req, res);
            }
        }
    });

function verifyToken(token) {
    return new Promise((resolve, reject) => {
        jwt.verify(token, JWT_SIGNING_TOKEN, async (err, decoded) => {
            if (err) {
                reject(err);
            } else {
                if (decoded.data.reason === 'resetpassword') {
                    resolve(decoded.data);
                } else {
                    reject(new Error('Invalid token reason'));
                }
            }
        });
    });
}

function redirectToLogin(req, res) {
    res.redirect(localify(req.i18n.getLocale())('/user/login'));
}

function renderResetForm(req, res) {
    res.render(path.resolve(__dirname, './views/reset-password'), {
        errors: res.locals.errors || []
    });
}

function renderResetFormExpired(req, res) {
    res.render(path.resolve(__dirname, './views/reset-password-expired'));
}

router
    .route('/reset')
    .all(requireUnauthed)
    .get(async (req, res) => {
        let token = req.query.token ? req.query.token : res.locals.token;
        if (!token) {
            redirectToLogin(req, res);
        } else {
            try {
                await verifyToken(token);
                res.locals.token = token;
                renderResetForm(req, res);
            } catch (error) {
                renderResetFormExpired(req, res);
            }
        }
    })
    .post(async (req, res) => {
        const { token } = req.body;

        if (!token) {
            redirectToLogin(req, res);
        } else {
            try {
                const decodedData = await verifyToken(token);

                /**
                 * Validate new password,
                 * Include username in password to allow us to check against conditional rules
                 * e.g. password must not match username
                 */
                const validationResult = schema.accountSchema.validate(
                    { username: decodedData.userId, password: req.body.password },
                    { abortEarly: false, stripUnknown: true }
                );

                const errors = normaliseErrors({
                    validationError: validationResult.error,
                    errorMessages: schema.errorMessages,
                    locale: req.i18n.getLocale(),
                    fieldNames: ['password']
                });

                if (errors.length > 0) {
                    res.locals.errors = errors;
                    res.locals.token = token;
                    res.locals.formValues = validationResult.value;
                    return renderResetForm(req, res);
                } else {
                    try {
                        const user = await userService.findWithActivePasswordReset({
                            id: validationResult.value.username
                        });

                        if (user) {
                            await userService.updateNewPassword({
                                id: validationResult.value.username,
                                newPassword: validationResult.value.password
                            });
                        } else {
                            throw new Error('User not found');
                        }

                        res.redirect('/user/login?s=passwordUpdated');
                    } catch (error) {
                        res.locals.token = token;
                        res.locals.alertMessage = 'There was an problem updating your password - please try again';
                        renderResetForm(req, res);
                    }
                }
            } catch (error) {
                renderResetFormExpired(req, res);
            }
        }
    });

module.exports = router;
