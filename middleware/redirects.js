'use strict';
const slashes = require('connect-slashes');

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

module.exports = {
    all: [redirectNonWww, redirectLinkNoise, removeTrailingSlashes],
    cleanLinkNoise,
    redirectNonWww,
    removeTrailingSlashes,
    redirectLinkNoise
};
