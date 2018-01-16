'use strict';

const config = require('config');
const { get } = require('lodash');
const { getBaseUrl, isWelsh, makeWelsh, removeWelsh, stripTrailingSlashes } = require('./urls');
const { createHeroImage } = require('./images');
const appData = require('./appData');
const routes = require('../controllers/routes');

const metadata = {
    title: config.get('meta.title'),
    description: config.get('meta.description'),
    themeColour: config.get('meta.themeColour')
};

/**
 * getMetaTitle
 * Get normalised page title for metadata
 */
function getMetaTitle(base, pageTitle) {
    if (pageTitle) {
        return `${pageTitle} | ${base}`;
    } else {
        return base;
    }
}

function getHtmlClasses({ locale, highContrast }) {
    let parts = ['no-js', 'locale--' + locale];

    if (highContrast) {
        parts.push('contrast--high');
    }

    return parts.join(' ');
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
 * Look up the current URL and rewrite to another locale
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

    return baseUrl + cleanedUrlPath;
}

function init(app) {
    const setViewGlobal = (name, value) => {
        app.get('engineEnv').addGlobal(name, value);
    };

    const getViewGlobal = name => {
        return app.get('engineEnv').getGlobal(name);
    };

    setViewGlobal('appData', appData);

    setViewGlobal('metadata', metadata);

    setViewGlobal('getMetaTitle', getMetaTitle);

    setViewGlobal('getHtmlClasses', () => {
        return getHtmlClasses({
            locale: getViewGlobal('locale'),
            highContrast: getViewGlobal('highContrast')
        });
    });

    setViewGlobal('anchors', config.get('anchors'));

    setViewGlobal('buildUrl', (sectionName, pageName) => {
        const localePrefix = getViewGlobal('localePrefix');
        return buildUrl(localePrefix)(sectionName, pageName);
    });

    setViewGlobal('getCurrentUrl', getCurrentUrl);

    // a global function for finding errors from a form array
    setViewGlobal('getFormErrorForField', (errorList, fieldName) => {
        if (errorList && errorList.length > 0) {
            return errorList.find(e => e.param === fieldName);
        }
    });

    // utility to get flash messages in templates (this can cause race conditions otherwise)
    setViewGlobal('getFlash', (req, key, innerKey) => {
        if (req && req.flash) {
            if (req.flash(key)) {
                if (!innerKey) {
                    return req.flash(key);
                } else if (req.flash(key)[innerKey]) {
                    return req.flash(key)[innerKey];
                }
            }
        }
    });

    setViewGlobal('createHeroImage', function(opts) {
        return createHeroImage({
            small: opts.small,
            medium: opts.medium,
            large: opts.large,
            default: opts.default,
            caption: opts.caption
        });
    });
}

module.exports = {
    init,
    buildUrl,
    getCurrentUrl,
    getHtmlClasses,
    getMetaTitle
};
