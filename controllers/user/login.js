'use strict';
const passport = require('passport');
const { makeErrorList, makeUserLink, STATUSES } = require('./utils');

// try to validate a user's login request
// @TODO consider rate limiting?
const attemptAuth = (req, res, next) =>
    passport.authenticate('local', (err, user, info) => {
        if (err) {
            return next(err);
        } else {
            req.logIn(user, loginErr => {
                if (loginErr) {
                    // user not valid, send them to login again
                    res.locals.errors = makeErrorList(info.message);
                    res.locals.formValues = req.body;
                    return loginForm(req, res);
                } else {
                    // user is valid, send them on
                    let redirectUrl = makeUserLink('dashboard');

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

const loginForm = (req, res) => {
    res.locals.STATUSES = STATUSES;
    res.render('user/login', {
        csrfToken: req.csrfToken(),
        makeUserLink: makeUserLink,
        status: req.query.s || false
    });
};

module.exports = {
    attemptAuth,
    loginForm
};
