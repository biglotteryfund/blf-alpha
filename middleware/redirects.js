'use strict';
const config = require('config');
const slashes = require('connect-slashes');
const { compose } = require('lodash/fp');

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

/**
 * Clean spaces
 * Strips spaces from URLs
 */
function cleanSpaces(originalUrl) {
    const re = /%20|\s+/g;
    if (re.test(originalUrl)) {
        return originalUrl.replace(re, '');
    } else {
        return originalUrl;
    }
}

const cleanUrl = compose(cleanLinkNoise, cleanSpaces);

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

/**
 * Remove noise from urls
 * - cleanLinkNoise + cleanSpaces
 */
function removeUrlNoise(req, res, next) {
    const cleanedUrl = cleanUrl(req.originalUrl);
    if (req.method === 'GET' && cleanedUrl !== req.originalUrl) {
        res.redirect(301, cleanedUrl);
    } else {
        next();
    }
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
    common: [redirectNonWww, removeUrlNoise, removeTrailingSlashes],
    cleanLinkNoise,
    cleanSpaces,
    redirectNonWww,
    removeTrailingSlashes,
    redirectArchived,
    redirectNoWelsh
};
