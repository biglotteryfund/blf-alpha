'use strict';
const path = require('path');
const express = require('express');
const concat = require('lodash/concat');
const Sentry = require('@sentry/node');

const { Users } = require('../../db/models');
const { sanitise } = require('../../common/sanitise');
const { sendHtmlEmail } = require('../../common/mail');
const {
    getAbsoluteUrl,
    redirectForLocale,
    localify
} = require('../../common/urls');
const { requireNoAuth } = require('../../common/authed');
const {
    injectCopy,
    injectBreadcrumbs
} = require('../../common/inject-content');

const logger = require('../../common/logger').child({
    service: 'user'
});

const {
    signTokenPasswordReset,
    verifyTokenPasswordReset
} = require('./lib/jwt');
const schemas = require('./lib/account-schemas');
const validateSchema = require('./lib/validate-schema');

const router = express.Router();

async function processResetRequest(req, user) {
    const token = signTokenPasswordReset(user.id);

    const template = path.resolve(
        __dirname,
        './views/emails/email-from-locale.njk'
    );

    const urlPath = localify(req.i18n.getLocale())(
        `/user/password/reset?token=${token}`
    );
    const resetUrl = getAbsoluteUrl(req, urlPath);
    const templateData = {
        body: req.i18n.__('user.forgottenPassword.email.body', resetUrl)
    };

    await sendHtmlEmail(
        { template: template, templateData: templateData },
        {
            name: 'user_password_reset',
            sendTo: user.username,
            subject: req.i18n.__('user.forgottenPassword.email.subject')
        }
    );

    await Users.updateIsInPasswordReset(user.id);
}

function sendPasswordResetNotification(req, email) {
    const template = path.resolve(
        __dirname,
        './views/emails/email-from-locale.njk'
    );

    return sendHtmlEmail(
        {
            template: template,
            templateData: {
                body: req.i18n.__('user.resetPassword.email.body')
            }
        },
        {
            name: 'user_password_reset_success',
            sendTo: email,
            subject: req.i18n.__('user.resetPassword.email.subject')
        }
    );
}

function renderForgotForm(req, res, data = null, errors = []) {
    res.render(path.resolve(__dirname, './views/forgotten-password'), {
        formValues: data,
        errors: errors
    });
}

function renderResetForm(req, res, data = null, errors = []) {
    res.render(path.resolve(__dirname, './views/reset-password'), {
        formValues: data,
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
    .all(requireNoAuth, injectCopy('user.forgottenPassword'), injectBreadcrumbs)
    .get(renderForgotForm)
    .post(async function(req, res) {
        const validationResult = validateSchema(
            schemas.emailOnly(req.i18n),
            req.body
        );

        if (validationResult.isValid) {
            try {
                const { username } = validationResult.value;
                const user = await Users.findByUsername(sanitise(username));
                res.locals.passwordWasJustReset = true;

                if (user) {
                    await processResetRequest(req, user);
                    logger.info('Password reset request succeeded');
                }

                renderForgotForm(req, res);
            } catch (error) {
                logger.warn('Password reset request failed');
                Sentry.captureException(error);
                renderForgotForm(req, res);
            }
        } else {
            renderForgotForm(
                req,
                res,
                validationResult.value,
                validationResult.messages
            );
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
                await verifyTokenPasswordReset(token());
                res.locals.token = token();
                renderResetForm(req, res);
            } catch (error) {
                logger.warn('Password reset request token invalid');
                renderResetFormExpired(req, res);
            }
        } else {
            redirectForLocale(req, res, '/user/login');
        }
    })
    .post(async (req, res) => {
        // If we have a logged-in user, attempt to change their password
        if (req.user) {
            // Confirm the typed password matches the currently-stored one
            const passwordMatches = await Users.checkValidPassword(
                req.user.userData.password,
                req.body.oldPassword
            );

            if (passwordMatches === false) {
                const errors = [
                    {
                        param: 'oldPassword',
                        msg: req.i18n.__(
                            'user.validationMessages.oldPasswordWrong'
                        )
                    }
                ];
                renderResetForm(req, res, null, errors);
            } else {
                // Update the stored password to new one
                const validationResult = validateSchema(
                    schemas.passwordReset(req.i18n),
                    req.body
                );

                if (validationResult.isValid) {
                    try {
                        const username = req.user.userData.username;
                        const { password } = validationResult.value;
                        await Users.updateNewPassword({
                            id: req.user.userData.id,
                            newPassword: password
                        });
                        await sendPasswordResetNotification(req, username);
                        logger.info('Password change successful');
                        redirectForLocale(req, res, '/user?s=passwordUpdated');
                    } catch (error) {
                        logger.warn('Password change failed', error);
                        renderResetForm(req, res, validationResult.value, [
                            {
                                msg: req.i18n.__(
                                    'user.resetPassword.errorMessage'
                                )
                            }
                        ]);
                    }
                } else {
                    return renderResetForm(
                        req,
                        res,
                        validationResult.value,
                        validationResult.messages
                    );
                }
            }
        } else {
            // Handle an unauthorised user who submitted the form with a token
            const { token } = req.body;
            if (!token) {
                redirectForLocale(req, res, '/user/login');
            } else {
                // Is this user's token valid to modify this password?
                const validationResult = validateSchema(
                    schemas.passwordReset(req.i18n),
                    req.body
                );

                if (validationResult.isValid) {
                    let decodedData;
                    try {
                        decodedData = await verifyTokenPasswordReset(token);
                    } catch (jwtError) {
                        logger.info('Password reset token invalid');
                        return renderResetFormExpired(req, res);
                    }

                    try {
                        // Confirm the user was in password reset mode
                        const user = await Users.findWithActivePasswordReset(
                            decodedData.userId
                        );

                        if (user) {
                            await Users.updateNewPassword({
                                id: decodedData.userId,
                                newPassword: validationResult.value.password
                            });
                            await sendPasswordResetNotification(
                                req,
                                user.username
                            );

                            logger.info('Password reset email sent');

                            return redirectForLocale(
                                req,
                                res,
                                '/user/login?s=passwordUpdated'
                            );
                        } else {
                            logger.info('Password reset not valid for user');
                            redirectForLocale(req, res, '/user/login');
                        }
                    } catch (error) {
                        logger.warn('Password reset failed', error);
                        Sentry.captureException(error);
                        res.locals.token = token;
                        const errors = [
                            {
                                msg: req.i18n.__(
                                    'user.resetPassword.errorMessage'
                                )
                            }
                        ];
                        return renderResetForm(
                            req,
                            res,
                            validationResult.value,
                            errors
                        );
                    }
                }
            }
        }
    });

module.exports = router;
