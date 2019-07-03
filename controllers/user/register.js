'use strict';
const express = require('express');
const passport = require('passport');
const path = require('path');
const Sentry = require('@sentry/node');

const { Users } = require('../../db/models');
const { localify } = require('../../common/urls');
const sanitise = require('../../common/sanitise');
const logger = require('../../common/logger').child({
    service: 'user'
});
const { csrfProtection } = require('../../middleware/cached');
const injectCopy = require('../../common/inject-copy');

const {
    requireNoAuth,
    redirectUrlWithFallback
} = require('../../middleware/authed');

const validateSchema = require('./lib/validate-schema');
const { newAccounts } = require('./lib/account-schemas');
const sendActivationEmail = require('./lib/activation-email');

const router = express.Router();

function renderForm(req, res, data = null, errors = []) {
    res.render(path.resolve(__dirname, './views/register'), {
        csrfToken: req.csrfToken(),
        formValues: data,
        errors: errors
    });
}

router
    .route('/')
    .all(requireNoAuth, csrfProtection, injectCopy('user.register'))
    .get(renderForm)
    .post(async function handleRegister(req, res, next) {
        const validationResult = validateSchema(
            newAccounts(req.i18n.getLocale()),
            req.body
        );

        /**
         * Generic fallback error
         * Shown when there is an error authenticating or attempting to register with an existing user
         * This messages needs to be generic to avoid exposing the account state.
         */
        const genericError = req.i18n.__(
            res.locals.copy.genericError,
            localify(req.i18n.getLocale())('/user/password/forgot')
        );

        if (validationResult.isValid) {
            try {
                const { username, password } = validationResult.value;
                // check if this email address already exists
                // we can't use findOrCreate here because the password changes
                // each time we hash it, which sequelize sees as a new user
                const existingUser = await Users.findByUsername(username);

                if (existingUser) {
                    logger.warn('Account already exists');
                    res.locals.alertMessage = genericError;
                    renderForm(req, res, validationResult.value);
                } else {
                    const newUser = await Users.createUser({
                        username: sanitise(username),
                        password: password
                    });

                    // Success! now send them an activation email
                    const activationData = await sendActivationEmail(
                        req,
                        newUser
                    );

                    logger.info('Registration successful');

                    if (req.body.returnToken) {
                        // used for tests to verify activation works
                        res.send(activationData);
                    } else {
                        passport.authenticate('local', function(
                            authError,
                            authUser
                        ) {
                            if (authError) {
                                next(authError);
                            } else {
                                req.logIn(authUser, function(loginErr) {
                                    if (loginErr) {
                                        next(loginErr);
                                    } else {
                                        redirectUrlWithFallback(
                                            req,
                                            res,
                                            '/user?s=activationSent'
                                        );
                                    }
                                });
                            }
                        })(req, res, next);
                    }
                }
            } catch (error) {
                Sentry.captureException(error);
                res.locals.alertMessage = genericError;
                renderForm(req, res, validationResult.value);
            }
        } else {
            renderForm(
                req,
                res,
                validationResult.value,
                validationResult.messages
            );
        }
    });

module.exports = router;
