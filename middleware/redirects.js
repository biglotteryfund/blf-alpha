'use strict';
const slashes = require('connect-slashes');

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

module.exports = {
    all: [redirectNonWww, removeTrailingSlashes],
    redirectNonWww,
    removeTrailingSlashes
};
