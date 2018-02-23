'use strict';
const ms = require('ms');
const csurf = require('csurf');
const vary = require('vary');
const cacheControl = require('express-cache-controller');

const toSeconds = naturalTime => {
    const parsedMilliseconds = typeof naturalTime === 'string' ? ms(naturalTime) : naturalTime;
    return parsedMilliseconds / 1000;
};

const DEFAULT_MAX_AGE = toSeconds('30s');
const DEFAULT_S_MAX_AGE = toSeconds('5m');

const defaultVary = (req, res, next) => {
    vary(res, 'Cookie');
    next();
};

const defaultCacheControl = [
    cacheControl(),
    (req, res, next) => {
        const shouldHaveNoCache = res.locals.PREVIEW_MODE;
        res.cacheControl = shouldHaveNoCache
            ? { noStore: true }
            : { maxAge: DEFAULT_MAX_AGE, sMaxAge: DEFAULT_S_MAX_AGE };
        next();
    }
];

/**
 * No cache / no-store middleware
 */
const noCache = (req, res, next) => {
    res.cacheControl = { noStore: true };
    next();
};

/**
 * s-max-age middleware
 * @description Apply a custom shared max age value
 * @param { string } sMaxAgeValue  `s-max-age` value in natural language (e.g. 30s, 10m. 1h)
 */
const sMaxAge = sMaxAgeValue => {
    const sMaxAgeSeconds = toSeconds(sMaxAgeValue);
    return (req, res, next) => {
        res.cacheControl = { maxAge: DEFAULT_MAX_AGE, sMaxAge: sMaxAgeSeconds };
        next();
    };
};

/**
 * csrfProtection
 * Apply csrf protection and no-cache at the same time
 */
const csrfProtection = [csurf(), noCache];

module.exports = {
    toSeconds,
    defaultVary,
    defaultCacheControl,
    noCache,
    sMaxAge,
    csrfProtection
};
