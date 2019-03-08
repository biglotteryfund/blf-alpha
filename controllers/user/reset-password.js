'use strict';
const path = require('path');
const jwt = require('jsonwebtoken');
const express = require('express');

const { JWT_SIGNING_TOKEN } = require('../../modules/secrets');
const { requireUnauthed } = require('../../middleware/authed');
const userService = require('../../services/user');

const { localify } = require('../../modules/urls');
const { normaliseErrors } = require('../../modules/errors');
const { accountSchema, errorMessages } = require('./schema');

const router = express.Router();

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

function redirect(req, res) {
    res.redirect(localify(req.i18n.getLocale())('/user/login'));
}

function renderForm(req, res) {
    res.render(path.resolve(__dirname, './views/reset-password'), {
        errors: res.locals.errors || []
    });
}

function renderFormExpired(req, res) {
    res.render(path.resolve(__dirname, './views/reset-password-expired'));
}

router
    .route('/')
    .all(requireUnauthed)
    .get(async (req, res) => {
        let token = req.query.token ? req.query.token : res.locals.token;
        if (!token) {
            redirect(req, res);
        } else {
            try {
                await verifyToken(token);
                res.locals.token = token;
                renderForm(req, res);
            } catch (error) {
                renderFormExpired(req, res);
            }
        }
    })
    .post(async (req, res) => {
        const { token } = req.body;

        if (!token) {
            redirect(req, res);
        } else {
            try {
                const decodedData = await verifyToken(token);

                /**
                 * Validate new password,
                 * Include username in password to allow us to check against conditional rules
                 * e.g. password must not match username
                 */
                const validationResult = accountSchema.validate(
                    { username: decodedData.userId, password: req.body.password },
                    { abortEarly: false, stripUnknown: true }
                );

                const errors = normaliseErrors({
                    validationError: validationResult.error,
                    errorMessages: errorMessages,
                    locale: req.i18n.getLocale(),
                    fieldNames: ['password']
                });

                if (errors.length > 0) {
                    res.locals.errors = errors;
                    res.locals.token = token;
                    res.locals.formValues = validationResult.value;
                    return renderForm(req, res);
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
                        renderForm(req, res);
                    }
                }
            } catch (error) {
                renderFormExpired(req, res);
            }
        }
    });

module.exports = router;
