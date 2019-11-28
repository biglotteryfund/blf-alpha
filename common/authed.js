'use strict';
const { localify, redirectForLocale } = require('./urls');
const logger = require('./logger').child({ service: 'auth' });

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
        logger.info('User required but got unauthed', {
            url: req.originalUrl
        });
        const returnUrl = req.query.s
            ? `/user/login?s=${req.query.s}`
            : '/user/login';
        redirectWithReturnUrl(req, res, returnUrl);
    }
}

function requireActiveUser(req, res, next, cb = null) {
    if (req.isAuthenticated() && isStaff(req.user) === false) {
        if (isActivated(req.user) === true) {
            next();
        } else {
            logger.info('Active user required but got inactive', {
                url: req.originalUrl
            });
            redirectWithReturnUrl(req, res, '/user/activate');
        }
    } else {
        if (cb) {
            cb(req, res);
        }
        logger.info('Active user required but got unauthed', {
            url: req.originalUrl
        });
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
        logger.info('Inactive user required but got other', {
            url: req.originalUrl
        });
        redirectUrlWithFallback(req, res, '/user');
    }
}

/**
 * Required staff auth
 * Middleware to require that the visitor is logged in as a staff user
 */
function requireStaffAuth(req, res, next) {
    const redirectUrl = `/user/staff/login?redirectUrl=${encodeURIComponent(
        req.originalUrl
    )}`;

    if (req.isAuthenticated()) {
        if (isStaff(req.user)) {
            next();
        } else {
            // Log out regular users and send them to the staff page
            req.logout();
            req.session.save(() => {
                res.redirect(redirectUrl);
            });
        }
    } else {
        res.redirect(redirectUrl);
    }
}

/*
 * Required note staff auth
 * Middleware to require that the visitor is NOT logged in as a staff user
 */
function requireNotStaffAuth(req, res, next) {
    if (req.isAuthenticated() && isStaff(req.user)) {
        logger.info('Non-staff user required but got staff', {
            url: req.originalUrl
        });
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
    requireActiveUserWithCallback,
    isActivated
};
