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

function renderForm(req, res) {
    res.render(path.resolve(__dirname, './views/login'), {
        csrfToken: req.csrfToken(),
        alertMessage: alertMessage({
            locale: req.i18n.getLocale(),
            status: req.query.s
        })
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
                        redirectUrlWithFallback(
                            localify(req.i18n.getLocale())('/user'),
                            req,
                            res
                        );
                    }
                });
            }
        })(req, res, next);
    });

module.exports = router;
