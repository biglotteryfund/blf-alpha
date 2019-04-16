'use strict';
const path = require('path');
const express = require('express');
const passport = require('passport');
const { concat } = require('lodash');

const router = express.Router();

const { csrfProtection } = require('../../middleware/cached');
const { requireUnauthed, redirectUrlWithFallback } = require('../../middleware/authed');
const { localify } = require('../../modules/urls');

function renderForm(req, res) {
    let alertMessage;
    switch (req.query.s) {
        case 'loggedOut':
            alertMessage = 'You were successfully logged out.';
            break;
        case 'passwordUpdated':
            alertMessage = 'Your password was successfully updated! Please log in below.';
            break;
        case 'passwordResetRequest':
            alertMessage =
                'Password reset requested. If the email address entered is correct, you will receive further instructions via email.';
            break;
    }

    res.locals.breadcrumbs = concat(res.locals.breadcrumbs, {
        label: 'Log in'
    });

    res.render(path.resolve(__dirname, './views/login'), {
        csrfToken: req.csrfToken(),
        alertMessage: alertMessage
    });
}

router
    .route('/')
    .all(csrfProtection, requireUnauthed)
    .get(renderForm)
    .post((req, res, next) => {
        // @TODO consider rate limiting?
        passport.authenticate('local', (err, user, info) => {
            if (!user) {
                // User not valid, send them to login again
                res.locals.errors = [{ msg: info.message }];
                res.locals.formValues = req.body;
                return renderForm(req, res);
            }

            if (err) {
                next(err);
            } else {
                req.logIn(user, loginErr => {
                    if (loginErr) {
                        next(loginErr);
                    } else {
                        const fallbackUrl = localify(req.i18n.getLocale())('/user');
                        redirectUrlWithFallback(fallbackUrl, req, res);
                    }
                });
            }
        })(req, res, next);
    });

module.exports = router;
