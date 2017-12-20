'use strict';

const config = require('config');
const sassConfig = require('../config/content/sass.json');
const routes = require('../controllers/routes');
const { rewriteFullUrlForLocale } = require('../services/locales');
const { createHeroImage } = require('./images');
const appData = require('./appData');

function init(app) {
    const setViewGlobal = (name, value) => {
        app.get('engineEnv').addGlobal(name, value);
    };

    const getViewGlobal = name => {
        return app.get('engineEnv').getGlobal(name);
    };

    setViewGlobal('appData', appData);

    setViewGlobal('routes', routes.sections);

    // configure meta tags
    setViewGlobal('metadata', {
        title: config.get('meta.title'),
        description: config.get('meta.description'),
        themeColour: sassConfig.themeColour
    });

    setViewGlobal('getHtmlClasses', function() {
        const locale = getViewGlobal('locale');
        const highContrast = getViewGlobal('highContrast');

        let parts = ['no-js', 'locale--' + locale];

        if (highContrast) {
            parts.push('contrast--high');
        }

        return parts.join(' ');
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
        let localePrefix = getViewGlobal('localePrefix');
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

    // look up the current URL and rewrite to another locale
    setViewGlobal('getCurrentUrl', function(req, locale) {
        return rewriteFullUrlForLocale({
            locale: locale,
            urlPath: req.originalUrl,
            // Is this an HTTPS request? make the URL protocol work
            protocol: req.get('X-Forwarded-Proto') || req.protocol,
            host: req.get('host')
        });
    });
}

module.exports = {
    init
};
