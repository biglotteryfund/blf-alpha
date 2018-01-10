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

/**
 * Strip trailing slashes from a string
 * Used to strip slashes from URLs like '/welsh/' => '/welsh'
 */
const stripTrailingSlashes = str => {
    const hasTrailingSlash = s => s[s.length - 1] === '/' && s.length > 1;
    if (hasTrailingSlash(str)) {
        str = str.substring(0, str.length - 1);
    }
    return str;
};

module.exports = {
    WELSH_REGEX,
    isWelsh,
    makeWelsh,
    removeWelsh,
    localify,
    cymreigio,
    stripTrailingSlashes
};
