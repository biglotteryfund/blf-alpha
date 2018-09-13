'use strict';
const express = require('express');
const { get } = require('lodash');

const { toolsSecurityHeaders } = require('../../middleware/securityHeaders');
const { userBasePath, userEndpoints, emailPasswordValidations, formValidations, STATUSES } = require('./utils');
const auth = require('../../middleware/authed');
const cached = require('../../middleware/cached');
const dashboard = require('./dashboard');
const login = require('./login');
const password = require('./password');
const register = require('./register');
const staffRoutes = require('./staff');

const router = express.Router();

router.use(toolsSecurityHeaders());


function ensureUserOnly(req, res, next) {
    if (req.isAuthenticated() && get(req, ['user', 'userType'], false) === 'user') {
        return next();
    }
    res.redirect('/user/login');
}

function ensureStaffOnly(req, res, next) {
    if (req.isAuthenticated() && get(req, ['user', 'userType'], false) === 'staff') {
        return next();
    }
    req.session.redirectUrl = req.originalUrl;
    req.session.save(() => {
        console.log('sess', req.session);
        res.redirect('/user/staff/login');
    });
}

router.get('/user-only', ensureUserOnly, (req, res) => {
   res.send(req.user);
});

router.get('/staff-only', ensureStaffOnly, (req, res) => {
    res.send(req.user);
});

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
router
    .route(userEndpoints.requestpasswordreset)
    .get(auth.requireUnauthed, cached.noCache, password.requestResetForm)
    .post(auth.requireUnauthed, formValidations.emailAddress, password.sendResetEmail);

// change a password (with a token)
router
    .route(userEndpoints.resetpassword)
    .get(auth.requireUnauthed, cached.noCache, password.changePasswordForm)
    .post(auth.requireUnauthed, formValidations.password, password.updatePassword);


router.use('/staff', staffRoutes);

module.exports = router;
