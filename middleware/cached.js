'use strict';
const csurf = require('csurf');
const vary = require('vary');
const config = require('config');
const cacheControl = require('express-cache-controller');

// Apply default cache-control headers
const defaultHeaders = [
    (req, res, next) => {
        vary(res, 'Cookie');
        next();
    },
    cacheControl({
        maxAge: config.get('viewCacheExpiration')
    })
];

// Apply consistent no-cache headers
const noCache = (req, res, next) => {
    res.cacheControl = { noStore: true };
    next();
};

// Apply csrf protection and no-cache at the same time
const csrfProtection = [csurf(), noCache];

module.exports = {
    defaultHeaders,
    noCache,
    csrfProtection
};
