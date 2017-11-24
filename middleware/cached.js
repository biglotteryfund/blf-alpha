'use strict';

const csurf = require('csurf');
const config = require('config');
const cacheControl = require('express-cache-controller');

// Apply default cache-control headers
const defaultCacheControl = cacheControl({
    maxAge: config.get('viewCacheExpiration')
});

// Apply consistent no-cache headers
const noCache = (req, res, next) => {
    res.cacheControl = { noStore: true };
    next();
};

// Apply csrf protection and no-cache at the same time
const csrfProtection = [csurf(), noCache];

module.exports = {
    defaultCacheControl,
    noCache,
    csrfProtection
};
