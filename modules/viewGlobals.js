'use strict';
const config = require('config');
const { URL } = require('url');
const querystring = require('querystring');
const shortid = require('shortid');

const { getBaseUrl, isWelsh, makeWelsh, removeWelsh, stripTrailingSlashes } = require('./urls');
const { heroImages } = require('./images');
const appData = require('./appData');
const formHelpers = require('./forms');

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

    setViewGlobal('appData', appData);

    setViewGlobal('metadata', metadata);

    setViewGlobal('shortid', () => shortid());

    setViewGlobal('getMetaTitle', getMetaTitle);

    setViewGlobal('anchors', config.get('anchors'));

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
    getCurrentUrl,
    getMetaTitle,
    getCurrentSection
};
