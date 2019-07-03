'use strict';
const path = require('path');
const express = require('express');
const passport = require('passport');

const logger = require('../../common/logger').child({
    service: 'user'
});

const injectCopy = require('../../common/inject-copy');
const { injectBreadcrumbs } = require('../../middleware/inject-content');
const {
    requireNoAuth,
    redirectUrlWithFallback
} = require('../../middleware/authed');
const { csrfProtection } = require('../../middleware/cached');

const alertMessage = require('./lib/alert-message');

const router = express.Router();

function renderForm(req, res, formValues = null, errors = []) {
    res.render(path.resolve(__dirname, './views/login'), {
        csrfToken: req.csrfToken(),
        formValues: formValues,
        errors: errors
    });
}

router
    .route('/')
    .all(
        csrfProtection,
        requireNoAuth,
        injectCopy('user.login'),
        injectBreadcrumbs
    )
    .get(function(req, res) {
        res.locals.alertMessage = alertMessage({
            locale: req.i18n.getLocale(),
            status: req.query.s
        });
        renderForm(req, res);
    })
    .post((req, res, next) => {
        logger.info('Login attempted');
        passport.authenticate('local', function(err, user) {
            if (err) {
                logger.error('Authentication failed', err);
                next(err);
            } else if (user) {
                req.logIn(user, function(loginErr) {
                    if (loginErr) {
                        logger.error('Login failed', loginErr);
                        next(loginErr);
                    } else {
                        logger.info('Login succeeded');
                        redirectUrlWithFallback(req, res, '/user');
                    }
                });
            } else {
                /**
                 * User is invalid
                 * Show a generic error message here to avoid exposing account state
                 */
                logger.warn('Login failed: invalid credentials');
                return renderForm(req, res, req.body, [
                    { msg: res.locals.copy.invalidUser }
                ]);
            }
        })(req, res, next);
    });

module.exports = router;
