'use strict';
const { localify, redirectForLocale } = require('./urls');

function isStaff(user) {
    return user.userType === 'staff';
}

function isActivated(user) {
    return user.userData.is_active === true;
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
        if (req.query.s) {
            redirectWithReturnUrl(req, res, `/user/login?s=${req.query.s}`);
        } else {
            redirectWithReturnUrl(req, res, '/user/login');
        }
    }
}

function requireActiveUser(req, res, next, cb = null) {
    if (req.isAuthenticated() && isStaff(req.user) === false) {
        if (isActivated(req.user) === true) {
            next();
        } else {
            redirectWithReturnUrl(req, res, '/user/activate');
        }
    } else {
        if (cb) {
            cb(req, res);
        }
        redirectWithReturnUrl(req, res, '/user/login');
    }
}

function requireActiveUserWithCallback(cb) {
    return (req, res, next) => requireActiveUser(req, res, next, cb);
}

function requireUnactivatedUser(req, res, next) {
    if (
        req.isAuthenticated() &&
        isStaff(req.user) === false &&
        isActivated(req.user) === false
    ) {
        next();
    } else {
        redirectUrlWithFallback(req, res, '/user');
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
            // Log out regular users and send them to the staff page
            req.logout();
            req.session.save(() => {
                next();
            });
        }
    } else {
        res.redirect(
            `/user/staff/login?redirectUrl=${encodeURIComponent(
                req.originalUrl
            )}`
        );
    }
}

/*
 * Required note staff auth
 * Middleware to require that the visitor is NOT logged in as a staff user
 */
function requireNotStaffAuth(req, res, next) {
    if (req.isAuthenticated() && isStaff(req.user)) {
        req.logout();
        req.session.save(() => {
            next();
        });
    } else {
        next();
    }
}

module.exports = {
    requireNoAuth,
    requireUserAuth,
    requireActiveUser,
    requireUnactivatedUser,
    requireStaffAuth,
    requireNotStaffAuth,
    redirectUrlWithFallback,
    requireActiveUserWithCallback
};
