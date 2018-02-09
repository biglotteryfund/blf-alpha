const config = require('config');

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

module.exports = {
    WELSH_REGEX,
    isWelsh,
    makeWelsh,
    removeWelsh,
    localify,
    cymreigio,
    getBaseUrl,
    getFullUrl,
    hasTrailingSlash,
    stripTrailingSlashes
};
