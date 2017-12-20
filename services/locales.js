const config = require('config');
const { stripTrailingSlashes } = require('../modules/urls');

const LOCALE_ENGLISH = 'en';
const LOCALE_WELSH = 'cy';

const WELSH_REGEX = /^\/welsh(\/|$)/;

/**
 * Check if a given URL is a valid welsh URL
 * @param {string} urlPath
 * @returns {boolean}
 */
function isWelshUrl(urlPath) {
    return urlPath.match(WELSH_REGEX) !== null;
}

/**
 * Create a welsh version of a given URL path
 * @param {string} urlPath
 * @returns {string}
 */
function makeWelsh(urlPath) {
    return `${config.get('i18n.urlPrefix.cy')}${urlPath}`;
}

/**
 * Remove welsh from a given URL path
 * @param {string} urlPath
 * @returns {string}
 */
function removeWelsh(urlPath) {
    return urlPath.replace(WELSH_REGEX, '/');
}

/**
 * Cymreigio aka Welshify
 * Create an array of paths: default (english) and welsh variant
 * @param {string} mountPath
 * @returns {array}
 */
function cymreigio(mountPath) {
    return [mountPath, makeWelsh(mountPath)];
}

/**
 * Rewrite URL to requested language
 * @returns {string}
 */
function rewriteFullUrlForLocale({ locale, urlPath, protocol, host }) {
    const IS_WELSH = isWelshUrl(urlPath);

    let newPath = urlPath;
    if (locale === 'cy' && !IS_WELSH) {
        newPath = makeWelsh(urlPath);
    } else if (locale === 'en' && IS_WELSH) {
        newPath = removeWelsh(urlPath);
    }

    const fullUrl = `${protocol}://${host}${newPath}`;
    return stripTrailingSlashes(fullUrl);
}

module.exports = {
    LOCALE_ENGLISH,
    LOCALE_WELSH,
    WELSH_REGEX,
    isWelshUrl,
    makeWelsh,
    removeWelsh,
    cymreigio,
    rewriteFullUrlForLocale
};
