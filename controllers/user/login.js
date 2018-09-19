'use strict';
const path = require('path');
const express = require('express');
const passport = require('passport');

const router = express.Router();

const { csrfProtection } = require('../../middleware/cached');
const { requireUnauthed } = require('../../middleware/authed');

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

    res.render(path.resolve(__dirname, './views/login'), {
        csrfToken: req.csrfToken(),
        alertMessage: alertMessage
    });
}

// @TODO consider rate limiting?
function handleLogin(req, res, next) {
    return passport.authenticate('local', (err, user, info) => {
        if (err) {
            return next(err);
        } else {
            req.logIn(user, loginErr => {
                if (loginErr) {
                    // User not valid, send them to login again
                    res.locals.errors = [{ msg: info.message }];
                    res.locals.formValues = req.body;
                    return renderForm(req, res);
                } else {
                    // User is valid, send them on
                    let redirectUrl = '/user';
                    if (req.body.redirectUrl) {
                        redirectUrl = req.body.redirectUrl;
                    } else if (req.session.redirectUrl) {
                        redirectUrl = req.session.redirectUrl;
                        delete req.session.redirectUrl;
                    } else if (res.locals.newStatus) {
                        redirectUrl += `?s=${res.locals.newStatus}`;
                    }

                    req.session.save(() => {
                        res.redirect(redirectUrl);
                    });
                }
            });
        }
    })(req, res, next);
}

router
    .route('/')
    .all(csrfProtection, requireUnauthed)
    .get(renderForm)
    .post(handleLogin);

module.exports = router;
