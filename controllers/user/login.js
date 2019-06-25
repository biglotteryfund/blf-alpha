'use strict';
const path = require('path');
const express = require('express');
const passport = require('passport');

const {
    injectCopy,
    injectBreadcrumbs
} = require('../../middleware/inject-content');
const {
    requireNoAuth,
    redirectUrlWithFallback
} = require('../../middleware/authed');
const { csrfProtection } = require('../../middleware/cached');

const logger = require('../../common/logger');
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
        logger.info('User login: attempted');
        passport.authenticate('local', function(err, user) {
            if (err) {
                logger.info('User login: failed', {
                    error: err
                });
                next(err);
            } else if (user) {
                req.logIn(user, function(loginErr) {
                    if (loginErr) {
                        logger.info('User login: failed', {
                            error: loginErr
                        });
                        next(loginErr);
                    } else {
                        logger.info('User login: succeeded');
                        redirectUrlWithFallback(req, res, '/user');
                    }
                });
            } else {
                /**
                 * User is invalid
                 * Show a generic error message here to avoid exposing account state
                 */
                logger.info('User login: failed', {
                    error: 'Invalid credentials'
                });
                return renderForm(req, res, req.body, [
                    { msg: `Your username and password combination is invalid` }
                ]);
            }
        })(req, res, next);
    });

module.exports = router;
