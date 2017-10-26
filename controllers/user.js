'use strict';
const express = require('express');
const router = express.Router();

const routeStatic = require('./utils/routeStatic');
const auth = require('../modules/authed');
const register = require('./user/register');
const login = require('./user/login');
const password = require('./user/password');
const { userBasePath, userEndpoints, emailPasswordValidations } = require('./user/utils');

// serve a logged-in user's dashboard
routeStatic.injectUrlRequest(router, userEndpoints.dashboard);
router.get(userEndpoints.dashboard, auth.requireAuthed, (req, res) => {
    res.cacheControl = { maxAge: 0 };
    res.render('user/dashboard', {
        user: req.user
    });
});

// register users
routeStatic.injectUrlRequest(router, userEndpoints.register);
router
    .route(userEndpoints.register)
    .get(auth.requireUnauthed, register.registrationForm)
    .post(emailPasswordValidations, register.createUser);

// login users
routeStatic.injectUrlRequest(router, userEndpoints.login);
router
    .route(userEndpoints.login)
    .get(auth.requireUnauthed, login.loginForm)
    .post(login.attemptAuth);

// logout users
router.get(userEndpoints.logout, (req, res) => {
    res.cacheControl = { maxAge: 0 };
    req.logout();
    // @TODO maybe add a flash token to inform they were logged out?
    req.session.save(() => {
        res.redirect(userBasePath + userEndpoints.login);
    });
});

// activate an account
router.get(userEndpoints.activate, auth.requireAuthed, register.activateUser);

// route to allow resetting password
// (either sending reset emails, or updating database)
routeStatic.injectUrlRequest(router, userEndpoints.resetpassword);
router
    .route(userEndpoints.resetpassword)
    .get(auth.requireUnauthed, password.resetForm)
    .post(auth.requireUnauthed, password.updatePassword);

module.exports = router;
