'use strict';
const { localify, redirectForLocale } = require('../common/urls');

function isStaff(user) {
    return user.userType === 'staff';
}

function redirectWithReturnUrl(req, res, urlPath) {
    req.session.redirectUrl = req.originalUrl;
    req.session.save(() => {
        redirectForLocale(req, res, urlPath);
    });
}

function redirectUrlWithFallback(req, res, urlPath) {
    let redirectUrl = localify(req.i18n.getLocale())(urlPath);
    if (req.query.redirectUrl) {
        redirectUrl = req.query.redirectUrl;
    } else if (req.body.redirectUrl) {
        redirectUrl = req.body.redirectUrl;
    } else if (req.session.redirectUrl) {
        redirectUrl = req.session.redirectUrl;
        delete req.session.redirectUrl;
    }

    req.session.save(() => {
        res.redirect(redirectUrl);
    });
}

/**
 * Require authenticated
 * Only allow non-authenticated users
 */
function requireNoAuth(req, res, next) {
    if (req.user) {
        redirectForLocale(req, res, '/user');
    } else {
        next();
    }
}

/**
 * Required user auth
 * Middleware to require that the visitor is logged in as a public user
 */
function requireUserAuth(req, res, next) {
    if (req.isAuthenticated() && isStaff(req.user) === false) {
        next();
    } else {
        redirectWithReturnUrl(req, res, '/user/login');
    }
}

function requireActiveUser(req, res, next) {
    if (req.isAuthenticated() && isStaff(req.user) === false) {
        if (req.user.is_active) {
            next();
        } else {
            redirectWithReturnUrl(req, res, '/user/activate');
        }
    } else {
        redirectWithReturnUrl(req, res, '/user');
    }
}

/**
 * Required staff auth
 * Middleware to require that the visitor is logged in as a staff user
 */
function requireStaffAuth(req, res, next) {
    if (req.isAuthenticated()) {
        if (isStaff(req.user)) {
            next();
        } else {
            res.redirect('/user');
        }
    } else {
        res.redirect(`/user/staff/login?redirectUrl=${req.originalUrl}`);
    }
}

/*
 * Required note staff auth
 * Middleware to require that the visitor is NOT logged in as a staff user
 */
function requireNotStaffAuth(req, res, next) {
    if (req.isAuthenticated() && isStaff(req.user)) {
        res.redirect('/tools');
    } else {
        next();
    }
}

module.exports = {
    requireNoAuth,
    requireUserAuth,
    requireActiveUser,
    requireStaffAuth,
    requireNotStaffAuth,
    redirectUrlWithFallback
};
