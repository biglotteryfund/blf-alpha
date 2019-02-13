'use strict';
const { URL } = require('url');
const config = require('config');
const querystring = require('querystring');

const WELSH_REGEX = /^\/welsh(\/|$)/;

/**
 * isWelsh
 * Is the current URL a welsh URL
 */
function isWelsh(urlPath) {
    return urlPath.match(WELSH_REGEX) !== null;
}

/**
 * makeWelsh
 * Create a welsh version of a given URL path
 */
function makeWelsh(urlPath) {
    return `${config.get('i18n.urlPrefix.cy')}${urlPath}`;
}

/**
 * removeWelsh
 * Opposite of makeWelsh
 */
function removeWelsh(urlPath) {
    return urlPath.replace(WELSH_REGEX, '/');
}

/**
 * localify
 * Rewrite urlPath into the current locale
 */
function localify(locale) {
    return function(urlPath) {
        const urlIsWelsh = isWelsh(urlPath);

        let newUrlPath = urlPath;
        if (locale === 'cy' && !urlIsWelsh) {
            newUrlPath = makeWelsh(urlPath);
        } else if (locale === 'en' && urlIsWelsh) {
            newUrlPath = urlPath.replace(WELSH_REGEX, '/');
        }
        return stripTrailingSlashes(newUrlPath);
    };
}

function getBaseUrl(req) {
    const headerProtocol = req.get('X-Forwarded-Proto');
    const protocol = headerProtocol ? headerProtocol : req.protocol;
    return `${protocol}://${req.get('host')}`;
}

function getFullUrl(req) {
    const baseUrl = getBaseUrl(req);
    return `${baseUrl}${req.originalUrl}`;
}

function getAbsoluteUrl(req, urlPath) {
    if (urlPath.indexOf('://') === -1) {
        const baseUrl = getBaseUrl(req);
        return `${baseUrl}${urlPath}`;
    } else {
        return urlPath;
    }
}

/**
 * hasTrailingSlash
 * Does a given URL end with a trailing slash
 */
function hasTrailingSlash(urlPath) {
    return urlPath[urlPath.length - 1] === '/' && urlPath.length > 1;
}

/**
 * Strip trailing slashes from a string
 * Used to strip slashes from URLs like '/welsh/' => '/welsh'
 */
function stripTrailingSlashes(urlPath) {
    if (hasTrailingSlash(urlPath)) {
        urlPath = urlPath.substring(0, urlPath.length - 1);
    }

    return urlPath;
}

/**
 * Sanitise URL path
 * Strip welsh + any preceding or trailing slashes,
 * leaving plain URL slug. e.g. /welsh/about/ => about
 */
function sanitiseUrlPath(urlPath) {
    return stripTrailingSlashes(removeWelsh(urlPath).replace(/^\/+/g, ''));
}

/**
 * getCurrentUrl
 * - Look up the current URL and rewrite to another locale
 * - Normalises and prunes query strings
 */
function getCurrentUrl(req, requestedLocale) {
    const urlPath = req.originalUrl;
    const baseUrl = getBaseUrl(req);

    const isCurrentUrlWelsh = isWelsh(urlPath);
    const isCyWithEnRequested = isCurrentUrlWelsh && requestedLocale === 'en';
    const isEnWithCyRequested = !isCurrentUrlWelsh && requestedLocale === 'cy';

    // Rewrite URL to requested language
    let urlPathForRequestedLocale = urlPath;
    if (isEnWithCyRequested) {
        urlPathForRequestedLocale = makeWelsh(urlPath);
    } else if (isCyWithEnRequested) {
        urlPathForRequestedLocale = removeWelsh(urlPath);
    }

    // Remove any trailing slashes (eg. /welsh/ => /welsh)
    const cleanedUrlPath = stripTrailingSlashes(urlPathForRequestedLocale);

    const fullUrl = baseUrl + cleanedUrlPath;

    const parsedUrl = new URL(fullUrl);
    const parsedPathname = parsedUrl.pathname;
    const parsedQuery = parsedUrl.search.replace(/^\?/, '');

    // Remove draft and version parameters
    const originalQuery = querystring.parse(parsedQuery);
    delete originalQuery.version;
    delete originalQuery.draft;

    // Reconstruct clean URL
    const newCleanQuery = querystring.stringify(originalQuery);
    return newCleanQuery.length > 0 ? `${parsedPathname}?${newCleanQuery}` : parsedPathname;
}

module.exports = {
    getAbsoluteUrl,
    getBaseUrl,
    getCurrentUrl,
    getFullUrl,
    hasTrailingSlash,
    isWelsh,
    localify,
    makeWelsh,
    removeWelsh,
    sanitiseUrlPath,
    stripTrailingSlashes,
    WELSH_REGEX
};
