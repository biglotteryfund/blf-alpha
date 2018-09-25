'use strict';
const { get } = require('lodash');

/**
 * Require unauthed
 * Only allow non-authenticated users
 */
function requireUnauthed(req, res, next) {
    if (!req.user) {
        return next();
    } else {
        res.redirect('/user');
    }
}

/**
 * Required user auth
 * Middleware to require that the visitor is logged in as a public user
 */
function requireUserAuth(req, res, next) {
    if (req.isAuthenticated() && get(req, 'user.userType', false) === 'user') {
        return next();
    } else {
        res.redirect('/user/login');
    }
}

/**
 * Required staff auth
 * Middleware to require that the visitor is logged in as a staff user
 */
function requireStaffAuth(req, res, next) {
    if (req.isAuthenticated() && get(req, 'user.userType', false) === 'staff') {
        return next();
    } else {
        res.redirect(`/user/staff/login?redirectUrl=${req.originalUrl}`);
    }
}

module.exports = {
    requireUnauthed,
    requireUserAuth,
    requireStaffAuth
};
