'use strict';
const hasIn = require('lodash/hasIn');
const { localify } = require('../common/urls');

function isStaff(user) {
    return hasIn(user, 'oid') === true;
}

/**
 * Require authenticated
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
    if (req.isAuthenticated() && isStaff(req.user) === false) {
        next();
    } else {
        req.session.redirectUrl = req.originalUrl;
        req.session.save(() => {
            res.redirect(localify(req.i18n.getLocale())('/user/login'));
        });
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
    if (req.isAuthenticated() && req.user.getType() === 'staff') {
        res.redirect('/tools');
    } else {
        next();
    }
}

function redirectUrlWithFallback(fallbackUrl, req, res) {
    let redirectUrl = fallbackUrl;
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

module.exports = {
    requireUnauthed,
    requireUserAuth,
    requireStaffAuth,
    requireNotStaffAuth,
    redirectUrlWithFallback
};
