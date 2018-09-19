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
    res.render('user/interstitial', {
        redirectUrl: redirectUrl
    });
});

// Redirect user to Microsoft to sign in
router.get('/login', function(req, res, next) {
    // We pass customState to allow redirecting to the original URL once authed
    // because the session bug (below) causes req.session to be uninitialised when we need it
    passport.authenticate('azuread-openidconnect', {
        response: res,
        failureRedirect: '/user/staff/error',
        customState: req.session.redirectUrl
    })(req, res, next);
});

// User will be returned here
router.post('/auth/openid/return', function(req, res, next) {
    passport.authenticate(
        'azuread-openidconnect',
        {
            response: res,
            failureRedirect: '/user/staff/error'
        },
        function(authError, user) {
            if (authError) {
                return next(authError);
            }
            if (!user) {
                return res.redirect('/user/login');
            }

            req.login(user, {}, loginError => {
                if (loginError) {
                    return next(loginError);
                }

                // HACKY WORKAROUND:
                // There's a long-running Passport/session bug where redirects
                // fire before session is created:
                // https://github.com/jaredhanson/passport/pull/680
                // So we have a temporary holding page which allows the request to resolve
                // @TODO see if a fix is possible for this
                return res.redirect(`/user/staff/interstitial?redirectUrl=${req.body.state}`);
            });
        }
    )(req, res, next);
});

router.get('/error', (req, res) => {
    res.render(path.resolve(__dirname, 'views/error'), {});
});

module.exports = router;
