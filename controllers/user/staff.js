'use strict';
const express = require('express');
const passport = require('passport');
const path = require('path');

const router = express.Router();

router.get('/interstitial', (req, res) => {
    let redirectUrl = '/user';
    if (req.query.redirectUrl) {
        redirectUrl = req.query.redirectUrl;
    }
    res.render(path.resolve(__dirname, 'views/interstitial'), {
        redirectUrl: redirectUrl
    });
});

/**
 * Redirect user to Microsoft to sign in
 *
 * We pass customState to allow redirecting to the
 * original URL once authenticated because the session bug
 * (below) causes req.session to be uninitialised.
 */
router.get('/login', function(req, res, next) {
    passport.authenticate('azuread-openidconnect', {
        failureRedirect: '/user/staff/error',
        customState: req.query.redirectUrl
    })(req, res, next);
});

/**
 * OpenID return URL
 * User will be returned here after authenticating
 */
router.post('/auth/openid/return', function(req, res, next) {
    passport.authenticate(
        'azuread-openidconnect',
        { failureRedirect: '/user/staff/error' },
        function(authError, user) {
            if (authError) {
                return next(authError);
            }

            if (!user) {
                return res.redirect('/user/login');
            }

            req.login(user, loginErr => {
                if (loginErr) {
                    return next(loginErr);
                }

                /**
                 * There's a long-running Passport/session bug where redirects
                 * fire before session is created so we have a temporary holding
                 * page which allows the request to resolve
                 * @see https://github.com/jaredhanson/passport/pull/680
                 */
                return res.redirect(
                    `/user/staff/interstitial?redirectUrl=${req.body.state}`
                );
            });
        }
    )(req, res, next);
});

router.get('/logout', (req, res) => {
    req.logout();
    req.session.save(() => {
        res.redirect('/');
    });
});

router.get('/error', (req, res) => {
    res.render(path.resolve(__dirname, 'views/staff-error'), {});
});

module.exports = router;
