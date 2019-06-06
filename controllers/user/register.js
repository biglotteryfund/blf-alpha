'use strict';
const express = require('express');
const passport = require('passport');
const path = require('path');
const Sentry = require('@sentry/node');

const { localify } = require('../../common/urls');
const { sanitise } = require('../../common/validators');

const { csrfProtection } = require('../../middleware/cached');
const {
    injectCopy,
    injectBreadcrumbs
} = require('../../middleware/inject-content');
const {
    requireUnauthed,
    redirectUrlWithFallback
} = require('../../middleware/authed');

const { Users } = require('../../db/models');

const { newAccounts } = require('./lib/account-schemas');
const validateSchema = require('./lib/validate-schema');
const sendActivationEmail = require('./lib/activation-email');

const router = express.Router();

function logIn(req, res, next) {
    passport.authenticate('local', function(authError, authUser) {
        if (authError) {
            next(authError);
        } else {
            req.logIn(authUser, function(loginErr) {
                if (loginErr) {
                    next(loginErr);
                } else {
                    const fallbackUrl = localify(req.i18n.getLocale())(
                        '/user?s=activationSent'
                    );

                    redirectUrlWithFallback(fallbackUrl, req, res);
                }
            });
        }
    })(req, res, next);
}

function renderForm(req, res, data = null, errors = []) {
    res.render(path.resolve(__dirname, './views/register'), {
        csrfToken: req.csrfToken(),
        formValues: data,
        errors: errors
    });
}

router
    .route('/')
    .all(
        requireUnauthed,
        csrfProtection,
        injectCopy('user.register'),
        injectBreadcrumbs
    )
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
                const existingUser = await Users.findByUsername(
                    sanitise(username)
                );

                if (existingUser) {
                    Sentry.withScope(scope => {
                        scope.setLevel('info');
                        Sentry.captureMessage(
                            'A user tried to register with an existing email address'
                        );
                    });

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

                    if (req.body.returnToken) {
                        // used for tests to verify activation works
                        res.send(activationData);
                    } else {
                        logIn(req, res, next);
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
