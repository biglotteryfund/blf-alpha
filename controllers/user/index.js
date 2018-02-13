'use strict';
const express = require('express');

const auth = require('../../middleware/authed');
const cached = require('../../middleware/cached');
const { toolsSecurityHeaders } = require('../../middleware/securityHeaders');

const register = require('./register');
const login = require('./login');
const password = require('./password');
const dashboard = require('./dashboard');
const { userBasePath, userEndpoints, emailPasswordValidations, formValidations } = require('./utils');

const router = express.Router();

router.use(toolsSecurityHeaders());

// serve a logged-in user's dashboard
router.get(userEndpoints.dashboard, auth.requireAuthed, cached.noCache, dashboard.dashboard);

// register users
router
    .route(userEndpoints.register)
    .get(auth.requireUnauthed, (req, res) => res.send('Temporarily removed.'))
    // .get(auth.requireUnauthed, cached.csrfProtection, register.registrationForm)
    .post(emailPasswordValidations, cached.csrfProtection, register.createUser);

// login users
router
    .route(userEndpoints.login)
    .get(auth.requireUnauthed, cached.csrfProtection, login.loginForm)
    .post(cached.csrfProtection, login.attemptAuth);

// logout users
router.get(userEndpoints.logout, cached.noCache, (req, res) => {
    req.logout();
    req.flash('justLoggedOut', true);
    req.session.save(() => {
        res.redirect(userBasePath + userEndpoints.login);
    });
});

// activate an account
router.get(userEndpoints.activate, auth.requireAuthed, cached.noCache, register.activateUser);

// request a password reset email
router
    .route(userEndpoints.requestpasswordreset)
    .get(auth.requireUnauthed, cached.noCache, password.requestResetForm)
    .post(auth.requireUnauthed, formValidations.emailAddress, password.sendResetEmail);

// change a password (with a token)
router
    .route(userEndpoints.resetpassword)
    .get(auth.requireUnauthed, cached.noCache, password.changePasswordForm)
    .post(auth.requireUnauthed, formValidations.password, password.updatePassword);

module.exports = router;
