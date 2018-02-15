const config = require('config');
const { includes, reduce } = require('lodash');

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

const REGEX_IS_REGIONAL = /^\/(england|scotland|wales|northernireland)\//i;

/**
 * isRegionalUrl
 * Does the url path start with scotland, england, wales or nothernireland
 */
function isRegionalUrl(urlPath) {
    return REGEX_IS_REGIONAL.test(urlPath);
}

/**
 * stripRegion
 * Strip scotland, england, wales, or nothernireland from the urlPath
 */
function stripRegion(urlPath) {
    return urlPath.replace(REGEX_IS_REGIONAL, '/');
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

module.exports = {
    WELSH_REGEX,
    isWelsh,
    makeWelsh,
    removeWelsh,
    localify,
    cymreigio,
    isRegionalUrl,
    stripRegion,
    getBaseUrl,
    getFullUrl,
    hasTrailingSlash,
    stripTrailingSlashes,
    normaliseQuery
};
