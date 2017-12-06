'use strict';
const csurf = require('csurf');
const vary = require('vary');
const cacheControl = require('express-cache-controller');

const defaultVary = (req, res, next) => {
    vary(res, 'Cookie');
    next();
};

const defaultCacheControl = ({ defaultMaxAge }) => {
    return cacheControl({
        maxAge: defaultMaxAge
    });
};

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
