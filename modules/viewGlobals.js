'use strict';

const config = require('config');
const routes = require('../controllers/routes');
const { isWelsh, removeWelsh, stripTrailingSlashes } = require('./urls');
const { createHeroImage } = require('./images');
const appData = require('./appData');

const metadata = {
    title: config.get('meta.title'),
    description: config.get('meta.description'),
    themeColour: config.get('meta.themeColour')
};

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

function buildUrl(localePrefix) {
    return function(sectionName, pageName) {
        let section = routes.sections[sectionName];
        try {
            let page = section.pages[pageName];
            return localePrefix + section.path + page.path;
        } catch (e) {
            // pages from the "toplevel" section have no prefix
            // and aliases don't drop into the above block
            const IS_TOP_LEVEL = sectionName === 'toplevel';
            let url = IS_TOP_LEVEL ? '' : '/' + sectionName;
            if (pageName) {
                url += pageName;
            }
            url = localePrefix + url;
            // catch the edge case where we just want a link to the homepage in english
            if (url === '') {
                url = '/';
            }
            return url;
        }
    };
}

/**
 * getCurrentUrl
 * Look up the current URL and rewrite to another locale
 */
function getCurrentUrl(req, locale) {
    let currentPath = req.originalUrl;

    // is this an HTTPS request? make the URL protocol work
    let headerProtocol = req.get('X-Forwarded-Proto');
    let protocol = headerProtocol ? headerProtocol : req.protocol;
    let currentUrl = protocol + '://' + req.get('host') + currentPath;

    const isCurrentUrlWelsh = isWelsh(currentUrl);

    // rewrite URL to requested language
    if (locale === 'cy' && !isCurrentUrlWelsh) {
        // make this URL welsh
        currentUrl = protocol + '://' + req.get('host') + config.get('i18n.urlPrefix.cy') + currentPath;
    } else if (locale === 'en' && isCurrentUrlWelsh) {
        // un-welshify this URL
        currentUrl = removeWelsh(currentUrl);
    }

    // remove any trailing slashes (eg. /welsh/ => /welsh)
    currentUrl = stripTrailingSlashes(currentUrl);

    return currentUrl;
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

    // make anchors available everywhere (useful for routing and templates)
    setViewGlobal('anchors', config.get('anchors'));

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

    // linkbuilder function for helping with routes
    // @TODO this is a bit brittle/messy, could do with a cleanup
    setViewGlobal('buildUrl', (sectionName, pageName) => {
        const builder = buildUrl(getViewGlobal('localePrefix'));
        return builder(sectionName, pageName);
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

    setViewGlobal('getCurrentUrl', getCurrentUrl);
}

module.exports = {
    init,
    buildUrl,
    getCurrentUrl,
    getHtmlClasses,
    getMetaTitle
};
