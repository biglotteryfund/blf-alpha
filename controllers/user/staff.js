'use strict';
const express = require('express');
const path = require('path');
const router = express.Router();

const auth = require('../../middleware/authed');
const { AZURE_AUTH } = require('../../modules/secrets');

router.get('/', (req, res) => {
    // send the logged-in user to the place they wanted to get to
    if (req.isAuthenticated() && req.session.redirectUrl) {
        const redirectUrl = req.session.redirectUrl;
        delete req.session.redirectUrl;
        req.session.save(() => {
            res.redirect(redirectUrl);
        });
    } else {
        // @TODO
        res.send('<a href="/user/staff/login">login?</a>');
    }
});

router.get('/account', auth.requireAuthed, (req, res) => {
    // @TODO
    res.send(req.user);
});

router.get('/login', auth.staffAuthMiddlewareLogin, (req, res) => {
    res.redirect('/user/staff');
});

router.get('/auth/openid/return', auth.staffAuthMiddleware, (req, res) => {
    res.redirect('/user/staff');
});

router.post('/auth/openid/return', auth.staffAuthMiddleware, (req, res) => {
    res.redirect('/user/staff');
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
