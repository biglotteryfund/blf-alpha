'use strict';
const slashes = require('connect-slashes');
const { cleanLinkNoise } = require('../modules/urls');

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
    } else {
        next();
    }
}

const removeTrailingSlashes = slashes(false);

module.exports = [redirectNonWww, redirectLinkNoise, removeTrailingSlashes];
