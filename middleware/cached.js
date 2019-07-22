'use strict';
const csurf = require('csurf');

const DEFAULT_MAX_AGE_SECONDS = 30;
const DEFAULT_S_MAX_AGE_SECONDS = 300;

function defaultMaxAge(req, res, next) {
    res.cacheControl = {
        maxAge: DEFAULT_MAX_AGE_SECONDS,
        sMaxAge: DEFAULT_S_MAX_AGE_SECONDS
    };
    next();
}

/**
 * No-store middleware
 */
function noStore(req, res, next) {
    res.cacheControl = { noStore: true };
    next();
}

/**
 * s-max-age middleware
 * @description Apply a custom shared max age value
 * @param { number } sMaxAgeValue  `s-max-age` value in natural language (e.g. 30s, 10m. 1h)
 */
function sMaxAge(sMaxAgeValue) {
    return (req, res, next) => {
        res.cacheControl = {
            maxAge: DEFAULT_MAX_AGE_SECONDS,
            sMaxAge: sMaxAgeValue
        };
        next();
    };
}

/**
 * csrfProtection
 * Apply csrf protection and no-store at the same time
 */
const csrfProtection = [csurf(), noStore];

module.exports = {
    defaultMaxAge,
    // @TODO: Replace all instances of noCache with noStore
    noCache: noStore,
    noStore: noStore,
    sMaxAge,
    csrfProtection
};
