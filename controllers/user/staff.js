'use strict';
const express = require('express');
const passport = require('passport');
const path = require('path');
const router = express.Router();

const auth = require('../../middleware/authed');
const { AZURE_AUTH } = require('../../modules/secrets');

router.get('/', (req, res) => {
    // @TODO when the user is sent here after auth,
    // req.user / req.isAuthenticated are falsey
    // but a reload means they work... hmm.

    console.log('### root path GET');
    // send the logged-in user to the place they wanted to get to
    if (req.isAuthenticated() && req.session.redirectUrl) {
        // authorised and need redirecting
        const redirectUrl = req.session.redirectUrl;
        delete req.session.redirectUrl;
        console.log('### deleted session redirect');
        req.session.save(() => {
            res.redirect(redirectUrl);
        });
    } else if (req.isAuthenticated()) {
        // authorised, no redirect
        res.redirect('/user/staff/account');
    } else {
        // not authorised
        res.send('<a href="/user/staff/login">login?</a>');
    }
});

// router.get('/login', auth.staffAuthMiddlewareLogin, (req, res) => {
//     console.log('### login path GET');
//     res.redirect('/user/staff');
// });

router.get(
    '/login',
    function(req, res, next) {
        passport.authenticate('azuread-openidconnect', {
            response: res,
            failureRedirect: '/user/staff/error'
        })(req, res, next);
    },
    function(req, res) {
        res.redirect('/user/staff');
    }
);

// router.get('/auth/openid/return', auth.staffAuthMiddleware, (req, res) => {
//     console.log('### return path GET');
//     res.redirect('/user/staff');
// });

// router.post('/auth/openid/return', auth.staffAuthMiddleware, (req, res) => {
//     console.log('### return path POST');
//     res.redirect('/user/staff');
// });

router.post('/auth/openid/return', passport.authenticate('azuread-openidconnect', { failureRedirect: '/' }), function(
    req,
    res
) {
    console.log('### return path POST');
    req.session.save(() => {
        res.redirect('/user/staff');
    });
});

router.get('/logout', (req, res) => {
    req.session.destroy(() => {
        req.logOut();
        res.redirect(AZURE_AUTH.MS_DESTROY_URL);
    });
});

router.get('/error', (req, res) => {
    res.render(path.resolve(__dirname, 'views/error'), {});
});

module.exports = router;
