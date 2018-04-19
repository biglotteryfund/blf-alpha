'use strict';
const config = require('config');
const slashes = require('connect-slashes');

const { customEvent } = require('../modules/analytics');
const { isWelsh, removeWelsh } = require('../modules/urls');

/**
 * Clean link noise
 * Strips trailing /~/~/~/link.apsx noise from old Sitecore genrated URLs
 */
function cleanLinkNoise(originalUrl) {
    const re = /(~\/)*link.aspx$/;
    if (re.test(originalUrl)) {
        return originalUrl.replace(re, '');
    } else {
        return originalUrl;
    }
}

/**************************************
 * Middlewares
 **************************************/

function redirectNonWww(req, res, next) {
    const host = req.headers.host;
    const domainProd = 'biglotteryfund.org.uk';
    if (host === domainProd) {
        const redirectUrl = `${req.protocol}://www.${domainProd}${req.originalUrl}`;
        return res.redirect(301, redirectUrl);
    } else {
        return next();
    }
}

function redirectLinkNoise(req, res, next) {
    const cleanedUrl = cleanLinkNoise(req.originalUrl);
    if (cleanedUrl !== req.originalUrl) {
        res.redirect(301, cleanedUrl);
    }
    next();
}

const removeTrailingSlashes = slashes(false);

/**
 * Redirect archived links to the national archives
 */
function redirectArchived(req, res) {
    const fullUrl = `https://${config.get('siteDomain')}${req.originalUrl}`;
    customEvent('redirect', 'National Archives', req.originalUrl);
    res.redirect(301, `http://webarchive.nationalarchives.gov.uk/${fullUrl}`);
}

function redirectNoWelsh(req, res, next) {
    if (isWelsh(req.originalUrl)) {
        res.redirect(removeWelsh(req.originalUrl));
    } else {
        next();
    }
}

module.exports = {
    common: [redirectNonWww, redirectLinkNoise, removeTrailingSlashes],
    cleanLinkNoise,
    redirectNonWww,
    removeTrailingSlashes,
    redirectArchived,
    redirectNoWelsh
};
