'use strict';
const slashes = require('connect-slashes');
const { isRegionalUrl, stripRegion } = require('../modules/urls');

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

const removeTrailingSlashes = slashes(false);

function redirectRegion(req, res, next) {
    if (isRegionalUrl(req.originalUrl)) {
        res.redirect(301, stripRegion(req.originalUrl));
    } else {
        next();
    }
}

module.exports = {
    all: [redirectNonWww, removeTrailingSlashes, redirectRegion],
    redirectNonWww,
    removeTrailingSlashes,
    redirectRegion
};
