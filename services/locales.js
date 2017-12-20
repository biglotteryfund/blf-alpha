// @ts-check

const config = require('config');
const LOCALE_ENGLISH = 'en';
const LOCALE_WELSH = 'cy';

/**
 * Check if a given URL is a valid welsh URL
 * @param {string} url
 */
function isWelshUrl(url) {
    return url.match(/^\/welsh(\/|$)/) !== null;
}

/**
 * makeWelsh = create a welsh version of a given URL path
 */
function makeWelsh(routePath) {
    return `${config.get('i18n.urlPrefix.cy')}${routePath}`;
}

/**
 * cymreigio aka welshify - create an array of paths: default (english) and welsh variant
 */
function cymreigio(mountPath) {
    return [mountPath, makeWelsh(mountPath)];
}

module.exports = {
    LOCALE_ENGLISH,
    LOCALE_WELSH,
    isWelshUrl,
    makeWelsh,
    cymreigio
};
