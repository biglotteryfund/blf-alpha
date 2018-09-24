'use strict';
const { get } = require('lodash');
const config = require('config');

const checkAuthStatus = (req, res, next) => {
    if (req.isAuthenticated || req.user) {
        return next();
    } else {
        // we use req.originalUrl not req.path to preserve querystring
        req.session.redirectUrl = req.originalUrl;
        req.session.save(() => {
            res.redirect('/user/login');
        });
    }
};

// middleware for pages only authenticated users should see
// eg. dashboard
const requireAuthed = (req, res, next) => checkAuthStatus(req, res, next);
// middleware for pages only non-authed users should see
// eg. register/login
const requireUnauthed = (req, res, next) => {
    if (!req.user) {
        return next();
    } else {
        res.redirect('/user');
    }
};

// Middleware for pages only authenticated users should see
const requireUserAuth = (req, res, next) => {
    if (req.isAuthenticated() && get(req, 'user.userType', false) === 'user') {
        return next();
    }
    res.redirect('/user/login');
};

// Middleware for staff users only
const requireStaffAuth = (req, res, next) => {
    if (req.isAuthenticated() && get(req, 'user.userType', false) === 'staff') {
        return next();
    } else {
        req.session.redirectUrl = req.originalUrl;
        req.session.save(() => {
            res.redirect('/user/staff/login');
        });
    }
};

module.exports = {
    requireAuthed,
    requireUnauthed,
    requireUserAuth,
    requireStaffAuth
};
