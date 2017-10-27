'use strict';
const express = require('express');
const router = express.Router();

const routeStatic = require('../utils/routeStatic');
const auth = require('../../modules/authed');
const register = require('./register');
const login = require('./login');
const password = require('./password');
const { userBasePath, userEndpoints, makeUserLink, emailPasswordValidations, formValidations } = require('./utils');

// serve a logged-in user's dashboard
router.get(userEndpoints.dashboard, auth.requireAuthed, (req, res) => {
    res.cacheControl = { maxAge: 0 };
    res.render('user/dashboard', {
        user: req.user,
        makeUserLink: makeUserLink
    });
});

// register users
router
    .route(userEndpoints.register)
    .get(auth.requireUnauthed, register.registrationForm)
    .post(emailPasswordValidations, register.createUser);

// login users
router
    .route(userEndpoints.login)
    .get(auth.requireUnauthed, login.loginForm)
    .post(login.attemptAuth);

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
