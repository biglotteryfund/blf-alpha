'use strict';
const express = require('express');

const { toolsSecurityHeaders } = require('../../middleware/securityHeaders');
const { userBasePath, userEndpoints, emailPasswordValidations, formValidations, STATUSES } = require('./utils');
const auth = require('../../middleware/authed');
const cached = require('../../middleware/cached');
const { noindex } = require('../../middleware/robots');

const dashboard = require('./dashboard');
const login = require('./login');
const register = require('./register');

const router = express.Router();

router.use(noindex, toolsSecurityHeaders());

// serve a logged-in user's dashboard
router.get(userEndpoints.dashboard, cached.noCache, auth.requireAuthed, dashboard.dashboard);

// register users
router.get(userEndpoints.register, auth.requireUnauthed, cached.csrfProtection, register.registrationForm);
router.post(userEndpoints.register, emailPasswordValidations, cached.csrfProtection, register.createUser);

// login users
router
    .route(userEndpoints.login)
    .all(cached.csrfProtection)
    .get(auth.requireUnauthed, login.loginForm)
    .post(login.attemptAuth);

// logout users
router.get(userEndpoints.logout, cached.noCache, (req, res) => {
    req.logout();
    // Wait for the session to record the logout
    req.session.save(() => {
        const statusParam = `?s=${STATUSES.LOGGED_OUT}`;
        res.redirect(userBasePath + userEndpoints.login + statusParam);
    });
});

// activate an account
router.get(userEndpoints.activate, cached.noCache, auth.requireAuthed, register.activateUser);

// request a password reset email
router.use('/forgotten-password', require('./forgotten-password'));

router.use('/reset-password', require('./reset-password'));

module.exports = router;
