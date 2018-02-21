'use strict';
const config = require('config');
const csurf = require('csurf');
const vary = require('vary');
const cacheControl = require('express-cache-controller');

const defaultMaxAge = config.get('viewCacheExpiration');

const defaultVary = (req, res, next) => {
    vary(res, 'Cookie');
    next();
};

const defaultCacheControl = [
    cacheControl(),
    (req, res, next) => {
        if (res.locals.PREVIEW_MODE) {
            res.cacheControl = { noStore: true };
        } else {
            res.cacheControl = { maxAge: defaultMaxAge };
        }
        next();
    }
];

// Apply consistent no-cache headers
const noCache = (req, res, next) => {
    res.cacheControl = { noStore: true };
    next();
};

// Apply csrf protection and no-cache at the same time
const csrfProtection = [csurf(), noCache];

module.exports = {
    defaultVary,
    defaultCacheControl,
    noCache,
    csrfProtection
};
