'use strict';
const path = require('path');
const express = require('express');
const passport = require('passport');

const router = express.Router();

const { localify } = require('../../modules/urls');
const { csrfProtection } = require('../../middleware/cached');
const { addAlertMessage } = require('../../middleware/user');
const {
    injectCopy,
    injectBreadcrumbs
} = require('../../middleware/inject-content');
const {
    requireUnauthed,
    redirectUrlWithFallback
} = require('../../middleware/authed');

function renderForm(req, res) {
    res.render(path.resolve(__dirname, './views/login'), {
        csrfToken: req.csrfToken()
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
    .get(addAlertMessage, renderForm)
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
