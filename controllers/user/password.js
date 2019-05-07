'use strict';
const path = require('path');
const jwt = require('jsonwebtoken');
const express = require('express');
const Raven = require('raven');
const Joi = require('joi');
const { concat, get, head } = require('lodash');

const { localify, getAbsoluteUrl } = require('../../modules/urls');
const { JWT_SIGNING_TOKEN } = require('../../modules/secrets');
const { requireUnauthed } = require('../../middleware/authed');
const {
    injectCopy,
    injectBreadcrumbs
} = require('../../middleware/inject-content');

const { sendHtmlEmail } = require('../../services/mail');
const userService = require('../../services/user');

const normaliseErrors = require('./lib/normalise-errors');
const schema = require('./schema');

const router = express.Router();

async function processResetRequest(req, user) {
    const payload = { data: { userId: user.id, reason: 'resetpassword' } };
    const token = jwt.sign(payload, JWT_SIGNING_TOKEN, {
        expiresIn: '1h' // Short-lived token
    });

    await sendHtmlEmail(
        {
            template: path.resolve(
                __dirname,
                './views/emails/forgotten-password.njk'
            ),
            templateData: {
                locale: req.i18n.getLocale(),
                resetUrl: getAbsoluteUrl(
                    req,
                    `/user/password/reset?token=${token}`
                ),
                email: user.username
            }
        },
        {
            name: 'user_password_reset',
            sendTo: user.username,
            subject:
                'Reset the password for your The National Lottery Community Fund website account'
        }
    );

    await userService.updateIsInPasswordReset({
        id: user.id
    });
}

function sendPasswordResetNotification(req, email) {
    const template = path.resolve(
        __dirname,
        './views/emails/password-reset.njk'
    );

    return sendHtmlEmail(
        {
            template: template,
            templateData: {
                locale: req.i18n.getLocale(),
                email: email
            }
        },
        {
            name: 'user_password_reset_success',
            sendTo: email,
            subject: `Your National Lottery Community Fund account password was successfully reset`
        }
    );
}

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

function validatePasswordChangeRequest(username, password, locale) {
    /**
     * Validate new password,
     * Include username in password to allow us to check against conditional rules
     * e.g. password must not match username
     */
    const validationResult = schema.accountSchema.validate(
        { username: username, password: password },
        { abortEarly: false, stripUnknown: true }
    );

    const errorDetails = get(validationResult.error, 'details', []).filter(
        detail => head(detail.path) === 'password'
    );

    const errors = normaliseErrors({
        errorDetails: errorDetails,
        errorMessages: schema.errorMessages(locale)
    });

    return { validationResult, errors };
}

function redirectToLogin(req, res) {
    res.redirect(localify(req.i18n.getLocale())('/user/login'));
}

function renderForgotForm(req, res, data = null, errors = []) {
    res.render(path.resolve(__dirname, './views/forgotten-password'), {
        formValues: data,
        errors: errors
    });
}

function renderResetForm(req, res, errors = []) {
    res.render(path.resolve(__dirname, './views/reset-password'), {
        errors: errors
    });
}

function renderResetFormExpired(req, res) {
    res.locals.breadcrumbs = concat(res.locals.breadcrumbs, {
        label: 'Reset password'
    });
    res.render(path.resolve(__dirname, './views/reset-password-expired'));
}

/**
 * Route: forgotten password form
 */
router
    .route('/forgot')
    .all(
        requireUnauthed,
        injectCopy('user.forgottenPassword'),
        injectBreadcrumbs
    )
    .get(renderForgotForm)
    .post(async function(req, res) {
        const validationResult = Joi.object({
            username: schema.username
        }).validate(req.body, {
            abortEarly: false,
            stripUnknown: true
        });

        const errors = normaliseErrors({
            errorDetails: validationResult,
            errorMessages: schema.errorMessages(req.i18n.getLocale())
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
                    await processResetRequest(req, user);
                    res.locals.passwordWasJustReset = true;
                }

                renderForgotForm(req, res);
            } catch (error) {
                Raven.captureException(error);
                renderForgotForm(req, res);
            }
        }
    });

/**
 * Route: reset password form
 */
router
    .route('/reset')
    .all(injectCopy('user.resetPassword'), injectBreadcrumbs)
    .get(async (req, res) => {
        function token() {
            return req.query.token ? req.query.token : res.locals.token;
        }

        /**
         * 1. If we have a logged-in user, simply let them change their password
         * 2. Otherwise handle an unauthorised user and verify their query token is valid
         * 3. Redirect to login
         */
        if (req.user) {
            renderResetForm(req, res);
        } else if (token()) {
            try {
                await verifyToken(token());
                res.locals.token = token();
                renderResetForm(req, res);
            } catch (error) {
                renderResetFormExpired(req, res);
            }
        } else {
            redirectToLogin(req, res);
        }
    })
    .post(async (req, res) => {
        // If we have a logged-in user, attempt to change their password
        if (req.user) {
            // Confirm the typed password matches the currently-stored one
            const passwordMatches = await userService.isValidPassword(
                req.user.userData.password,
                req.body['password-old']
            );

            if (passwordMatches) {
                // Update the stored password to new one
                const {
                    validationResult,
                    errors
                } = validatePasswordChangeRequest(
                    req.user.userData.id,
                    req.body.password,
                    req.i18n.getLocale()
                );

                if (errors.length > 0) {
                    res.locals.formValues = validationResult.value;
                    return renderResetForm(req, res, errors);
                } else {
                    try {
                        await userService.updateNewPassword({
                            id: validationResult.value.username,
                            newPassword: validationResult.value.password
                        });
                        await sendPasswordResetNotification(
                            req,
                            req.user.userData.username
                        );
                        res.redirect('/user?s=passwordUpdated');
                    } catch (error) {
                        const updatingErrors = [
                            {
                                msg: `There was a problem updating your password`
                            }
                        ];

                        renderResetForm(req, res, updatingErrors);
                    }
                }
            } else {
                const errors = [
                    {
                        param: 'password-old',
                        msg: 'Your old password was not correct'
                    }
                ];
                renderResetForm(req, res, errors);
            }
        } else {
            // Handle an unauthorised user who submitted the form with a token
            const { token } = req.body;

            if (!token) {
                redirectToLogin(req, res);
            } else {
                try {
                    const decodedData = await verifyToken(token);

                    // Is this user's token valid to modify this password?
                    const {
                        validationResult,
                        errors
                    } = validatePasswordChangeRequest(
                        decodedData.userId,
                        req.body.password,
                        req.i18n.getLocale()
                    );

                    if (errors.length > 0) {
                        res.locals.errors = errors;
                        res.locals.token = token;
                        res.locals.formValues = validationResult.value;
                        return renderResetForm(req, res);
                    } else {
                        try {
                            // Confirm the user was in password reset mode
                            const user = await userService.findWithActivePasswordReset(
                                {
                                    id: validationResult.value.username
                                }
                            );

                            if (user) {
                                await userService.updateNewPassword({
                                    id: validationResult.value.username,
                                    newPassword: validationResult.value.password
                                });
                                await sendPasswordResetNotification(
                                    req,
                                    user.username
                                );
                            } else {
                                res.redirect('/user/login');
                            }

                            res.redirect('/user/login?s=passwordUpdated');
                        } catch (error) {
                            res.locals.token = token;
                            res.locals.alertMessage =
                                'There was a problem updating your password - please try again';
                            renderResetForm(req, res);
                        }
                    }
                } catch (error) {
                    renderResetFormExpired(req, res);
                }
            }
        }
    });

module.exports = router;
