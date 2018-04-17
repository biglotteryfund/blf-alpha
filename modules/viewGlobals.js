'use strict';

const config = require('config');
const { URL } = require('url');
const querystring = require('querystring');
const { get } = require('lodash');
const shortid = require('shortid');

const { getBaseUrl, isWelsh, makeWelsh, removeWelsh, stripTrailingSlashes } = require('./urls');
const { heroImages } = require('./images');
const appData = require('./appData');
const formHelpers = require('./forms');
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

function getCurrentSection(sectionId, pageId) {
    const isHomepage = sectionId === 'toplevel' && pageId === 'home';
    if (isHomepage) {
        return 'toplevel';
    } else if (sectionId !== 'toplevel') {
        return sectionId;
    }
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

    setViewGlobal('shortid', () => shortid());

    setViewGlobal('getMetaTitle', getMetaTitle);

    setViewGlobal('anchors', config.get('anchors'));

    setViewGlobal('buildUrl', (sectionName, pageName) => {
        const localePrefix = getViewGlobal('localePrefix');
        return buildUrl(localePrefix)(sectionName, pageName);
    });

    setViewGlobal('getCurrentUrl', getCurrentUrl);

    setViewGlobal('getCurrentSection', getCurrentSection);

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

    setViewGlobal('formHelpers', formHelpers);

    setViewGlobal('heroImages', heroImages);
}

module.exports = {
    init,
    buildUrl,
    getCurrentUrl,
    getMetaTitle,
    getCurrentSection
};
