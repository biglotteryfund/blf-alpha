'use strict';
const path = require('path');
const express = require('express');
const passport = require('passport');

const { localify } = require('../../common/urls');
const { csrfProtection } = require('../../middleware/cached');
const {
    injectCopy,
    injectBreadcrumbs
} = require('../../middleware/inject-content');
const {
    requireUnauthed,
    redirectUrlWithFallback
} = require('../../middleware/authed');

const alertMessage = require('./lib/alert-message');

const router = express.Router();

function renderForm(req, res, formValues = null, errors = []) {
    res.render(path.resolve(__dirname, './views/login'), {
        csrfToken: req.csrfToken(),
        alertMessage: alertMessage({
            locale: req.i18n.getLocale(),
            status: req.query.s
        }),
        formValues: formValues,
        errors: errors
    });
}

router
    .route('/')
    .all(
        csrfProtection,
        requireUnauthed,
        injectCopy('user.login'),
        injectBreadcrumbs
    )
    .get(renderForm)
    .post((req, res, next) => {
        passport.authenticate('local', function(err, user) {
            if (err) {
                next(err);
            } else if (user) {
                req.logIn(user, function(loginErr) {
                    if (loginErr) {
                        next(loginErr);
                    } else {
                        const url = localify(req.i18n.getLocale())('/user');
                        redirectUrlWithFallback(url, req, res);
                    }
                });
            } else {
                /**
                 * User is invalid
                 * Show a generic error message here to avoid exposing account state
                 */
                return renderForm(req, res, req.body, [
                    { msg: `Your username and password combination is invalid` }
                ]);
            }
        })(req, res, next);
    });

module.exports = router;
