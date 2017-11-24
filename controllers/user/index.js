'use strict';
const express = require('express');
const router = express.Router();

const auth = require('../../modules/authed');
const middleware = require('../../modules/middleware-helpers');
const register = require('./register');
const login = require('./login');
const password = require('./password');
const dashboard = require('./dashboard');
const { userBasePath, userEndpoints, emailPasswordValidations, formValidations } = require('./utils');

// serve a logged-in user's dashboard
router.get(userEndpoints.dashboard, auth.requireAuthed, dashboard.dashboard);

// register users
router
    .route(userEndpoints.register)
    // .get(auth.requireUnauthed, register.registrationForm)
    .get(auth.requireUnauthed, (req, res) => res.send('Temporarily removed.'))
    .post(emailPasswordValidations, register.createUser);

// login users
router
    .route(userEndpoints.login)
    .get(auth.requireUnauthed, middleware.csrfProtection, login.loginForm)
    .post(middleware.csrfProtection, login.attemptAuth);

// logout users
router.get(userEndpoints.logout, (req, res) => {
    res.cacheControl = { maxAge: 0 };
    req.logout();
    req.flash('justLoggedOut', true);
    req.session.save(() => {
        res.redirect(userBasePath + userEndpoints.login);
    });
});

// activate an account
router.get(userEndpoints.activate, auth.requireAuthed, register.activateUser);

// request a password reset email
router
    .route(userEndpoints.requestpasswordreset)
    .get(auth.requireUnauthed, password.requestResetForm)
    .post(auth.requireUnauthed, formValidations.emailAddress, password.sendResetEmail);

// change a password (with a token)
router
    .route(userEndpoints.resetpassword)
    .get(auth.requireUnauthed, password.changePasswordForm)
    .post(auth.requireUnauthed, formValidations.password, password.updatePassword);

module.exports = router;
