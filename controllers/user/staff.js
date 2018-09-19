'use strict';
const express = require('express');
const passport = require('passport');
const path = require('path');
const router = express.Router();

// const auth = require('../../middleware/authed');
const cached = require('../../middleware/cached');
const { AZURE_AUTH } = require('../../modules/secrets');


router.get('/interstitial', (req, res) => {
    res.render('user/interstitial', {
        redirectUrl: '/user/staff-only'
    });
});

router.get('/', cached.noCache, (req, res) => {
    console.log('req for /user/staff');
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


router.get(
    '/login',
    cached.noCache,
    function(req, res, next) {
        passport.authenticate('azuread-openidconnect', {
            response: res,
            failureRedirect: '/user/staff/error',
        })(req, res, next);
    });


// router.get('/auth/openid/return', cached.noCache, auth.staffAuthMiddleware, (req, res) => {
//     console.log('### return path GET');
//     res.redirect('/user/staff');
// });

// router.post('/auth/openid/return', cached.noCache, auth.staffAuthMiddleware, (req, res) => {
//     console.log('### return path POST');
//     res.redirect('/user/staff');
// });

// router.post('/auth/openid/return',
//     cached.noCache,
//     passport.authenticate('azuread-openidconnect', {
//         failureRedirect: '/',
//         successRedirect: '/user/staff?from=test'
//     }, function(err, user, info) {
//         console.log({
//             err,
//             user,
//             info
//         });
//     }),
//     function(req, res) {
//         console.log('### return path POST');
//         req.session.save(() => {
//             res.redirect('/user/staff?from=post');
//         });
// });

router.post('/auth/openid/return',
    cached.noCache,
    function(req, res, next) {
        passport.authenticate('azuread-openidconnect', {
            response: res,
            failureRedirect: '/user/staff/error',
        }, function(err, user) {
            if (err) { return next(err); }
            if (!user) {
                return res.redirect("/user/login");
            }

            req.login(user, {}, function(err) {
                console.log('got a user and logged in');
                if (err) { return next(err); }
                req.session.user = user;
                return req.session.save(() => {
                    return res.redirect('/user/staff/interstitial');
                });
            });
        })(req, res, next);
        // return;
    }
);



// router.post('/auth/openid/return',
//     cached.noCache,
//     passport.authenticate('azuread-openidconnect', {
//         failureRedirect: '/',
//         successRedirect: '/user/staff?from=test'
//     }),
//     function(req, res) {
//         console.log('### return path POST');
//         req.session.save(() => {
//             res.redirect('/user/staff?from=post');
//         });
// });

router.get('/logout', cached.noCache, (req, res) => {
    req.session.destroy(() => {
        req.logOut();
        res.redirect(AZURE_AUTH.MS_DESTROY_URL);
    });
});

router.get('/error', cached.noCache, (req, res) => {
    res.render(path.resolve(__dirname, 'views/error'), {});
});

module.exports = router;
