'use strict';
const passport = require('passport');

const { makeUserLink } = require('../controllers/user/utils');

const checkAuthStatus = (req, res, next, minimumLevel) => {
    // if (!minimumLevel) {
    //     minimumLevel = 0;
    // }
    if ((!minimumLevel && req.isAuthenticated) || (req.user && req.user.level >= minimumLevel)) {
        console.log('user valid for min level');
        return next();
    } else {
        console.log('user not authed');
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
        failureRedirect: '/user/staff/error'
    })(req, res, next);
}

// @TODO work out why we need this
// see https://github.com/AzureAD/passport-azure-ad
function staffAuthMiddlewareLogin(req, res, next) {
    passport.authenticate('azuread-openidconnect', {
        response: res,
        resourceURL: 'https://graph.windows.net',
        failureRedirect: '/user/staff/error'
    })(req, res, next);
}

module.exports = {
    requireAuthed,
    requireUnauthed,
    requireAuthedLevel,
    staffAuthMiddleware,
    staffAuthMiddlewareLogin
};
