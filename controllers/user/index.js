'use strict';
const express = require('express');
const flash = require('req-flash');

const auth = require('../../middleware/authed');
const cached = require('../../middleware/cached');
const { toolsSecurityHeaders } = require('../../middleware/securityHeaders');

const register = require('./register');
const login = require('./login');
const password = require('./password');
const dashboard = require('./dashboard');
const { userBasePath, userEndpoints, emailPasswordValidations, formValidations } = require('./utils');

const router = express.Router();

router.use(toolsSecurityHeaders(), flash());

// serve a logged-in user's dashboard
router.get(userEndpoints.dashboard, cached.noCache, auth.requireAuthed, dashboard.dashboard);

// register users
router
    .route(userEndpoints.register)
    .get(auth.requireUnauthed, (req, res) => res.send('Temporarily removed.'))
    // .get(auth.requireUnauthed, cached.csrfProtection, register.registrationForm)
    .post(emailPasswordValidations, cached.csrfProtection, register.createUser);

// login users
router
    .route(userEndpoints.login)
    .all(cached.csrfProtection)
    .get(auth.requireUnauthed, login.loginForm)
    .post(login.attemptAuth);

// logout users
router.get(userEndpoints.logout, cached.noCache, (req, res) => {
    req.logout();
    req.flash('justLoggedOut', true);
    req.session.save(() => {
        res.redirect(userBasePath + userEndpoints.login);
    });
});

// activate an account
router.get(userEndpoints.activate, cached.noCache, auth.requireAuthed, register.activateUser);

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
