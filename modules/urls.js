'use strict';
const { get, includes, reduce } = require('lodash');
const { URL } = require('url');
const config = require('config');
const querystring = require('querystring');

const routes = require('../controllers/routes');

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
function localify({ urlPath, locale }) {
    const urlIsWelsh = isWelsh(urlPath);

    let newUrlPath = urlPath;
    if (locale === 'cy' && !urlIsWelsh) {
        newUrlPath = makeWelsh(urlPath);
    } else if (locale === 'en' && urlIsWelsh) {
        newUrlPath = urlPath.replace(WELSH_REGEX, '/');
    }

    return stripTrailingSlashes(newUrlPath);
}

/**
 * cymreigio aka welshify
 * Create an array of paths: default (english) and welsh variant
 */
function cymreigio(urlPath) {
    return [urlPath, makeWelsh(urlPath)];
}

function getBaseUrl(req) {
    const headerProtocol = req.get('X-Forwarded-Proto');
    const protocol = headerProtocol ? headerProtocol : req.protocol;
    const baseUrl = `${protocol}://${req.get('host')}`;
    return baseUrl;
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
 * Normalize query
 * Old format URLs often get passed through as: ?area=Scotland&amp;amount=10001 - 50000
 * urlencoded &amp; needs to be normalised when fetching individual query param
 */
function normaliseQuery(originalQuery) {
    function reducer(newQuery, value, key) {
        const prefix = 'amp;';
        if (includes(key, prefix)) {
            newQuery[key.replace(prefix, '')] = value;
        } else {
            newQuery[key] = value;
        }

        return newQuery;
    }

    return reduce(originalQuery, reducer, {});
}

/**
 * buildUrl
 * URL helper, return canonical URL based on sectionName or pageName
 * Handle fallbacks for toplevel pages or linking to direct paths.
 */
function buildUrl(localePrefix) {
    /**
     * Handle URLs which can't be fetched directly from routes.
     * e.g. aliases, direct paths, top-level pages.
     */
    function constructFallback(sectionName, pageName) {
        // Construct base url. Normalise 'toplevel' section name.
        const baseUrl = sectionName === 'toplevel' ? '' : `/${sectionName}`;

        // Append the page name if we're given one
        const url = pageName ? baseUrl + pageName : baseUrl;

        // Prepend locale
        const urlWithLocale = localePrefix + url;

        // Catch the case where we just want a link to the homepage in english
        const normalisedUrl = urlWithLocale === '' ? '/' : urlWithLocale;

        return normalisedUrl;
    }

    return function(sectionName, pageName) {
        const sectionFromRoutes = get(routes.sections, sectionName);
        const pageFromSection = get(sectionFromRoutes, `pages.${pageName}`);

        if (pageFromSection) {
            return localePrefix + sectionFromRoutes.path + pageFromSection.path;
        } else {
            return constructFallback(sectionName, pageName);
        }
    };
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
    const newCleanUrl = newCleanQuery.length > 0 ? `${parsedPathname}?${newCleanQuery}` : parsedPathname;

    return newCleanUrl;
}

module.exports = {
    buildUrl,
    cymreigio,
    getAbsoluteUrl,
    getBaseUrl,
    getCurrentUrl,
    getFullUrl,
    hasTrailingSlash,
    isWelsh,
    localify,
    makeWelsh,
    normaliseQuery,
    removeWelsh,
    stripTrailingSlashes,
    WELSH_REGEX
};
