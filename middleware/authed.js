'use strict';
const passport = require('passport');

const { makeUserLink } = require('../controllers/user/utils');

const checkAuthStatus = (req, res, next, minimumLevel) => {
    if (!minimumLevel) {
        minimumLevel = 0;
    }
    if ((!minimumLevel && req.user) || req.user && req.user.level >= minimumLevel) {
        return next();
    } else {
        // we use req.originalUrl not req.path to preserve querystring
        req.session.redirectUrl = req.originalUrl;
        req.session.save(() => {
            res.redirect(makeUserLink('login'));
        });
    }
};

// middleware for pages only authenticated users should see
// eg. dashboard
const requireAuthed = (req, res, next) => checkAuthStatus(req, res, next);

const requireAuthedLevel = minimumLevel => {
    return (req, res, next) => checkAuthStatus(req, res, next, minimumLevel);
};

// middleware for pages only non-authed users should see
// eg. register/login
const requireUnauthed = (req, res, next) => {
    if (!req.user) {
        return next();
    } else {
        res.redirect(makeUserLink('dashboard'));
    }
};

function staffAuthMiddleware(req, res, next) {
    passport.authenticate('azuread-openidconnect', {
        response: res,
        failureRedirect: '/user/error'
    })(req, res, next);
}

function staffAuthMiddlewareLogin(req, res, next) {
    passport.authenticate('azuread-openidconnect', {
        response: res,
        resourceURL: 'https://graph.windows.net',
        failureRedirect: '/user/error'
    })(req, res, next);
}

module.exports = {
    requireAuthed,
    requireUnauthed,
    requireAuthedLevel,
    staffAuthMiddleware,
    staffAuthMiddlewareLogin
};
