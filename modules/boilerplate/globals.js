'use strict';
const app = require('../../server');
const fs = require('fs');
const path = require('path');
const config = require('config');
const sassConfig = require('../../config/content/sass.json');
const routes = require('../../controllers/routes');
const utilities = require('../../modules/utilities');

const getGlobal = name => {
    return app.get('engineEnv').getGlobal(name);
};

const setGlobal = (name, value) => {
    return app.get('engineEnv').addGlobal(name, value);
};

// extract deploy ID from AWS (where provided)
let deploymentData;
try {
    deploymentData = JSON.parse(fs.readFileSync(path.join(__dirname, '../../config/deploy.json'), 'utf8'));
} catch (e) {
    // console.info('deploy.json not found -- are you in DEV mode?');
}

const appEnv = process.env.NODE_ENV || 'development';

// store some app-wide config data
setGlobal('appData', {
    deployId: deploymentData && deploymentData.deployId ? deploymentData.deployId : 'DEV',
    buildNumber: deploymentData && deploymentData.buildNumber ? deploymentData.buildNumber : 'DEV',
    commitId: deploymentData && deploymentData.commitId ? deploymentData.commitId : 'DEV',
    IS_DEV: appEnv === 'development',
    environment: appEnv,
    config: config
});

// configure meta tags
setGlobal('metadata', {
    title: config.get('meta.title'),
    description: config.get('meta.description'),
    themeColour: sassConfig.themeColour
});

setGlobal('getHtmlClasses', function() {
    const locale = getGlobal('locale');
    const highContrast = getGlobal('highContrast');

    let parts = ['no-js', 'locale--' + locale];

    if (highContrast) {
        parts.push('contrast--hight');
    }

    return parts.join(' ');
});

// make anchors available everywhere (useful for routing and templates)
setGlobal('anchors', config.get('anchors'));

// a global function for finding errors from a form array
setGlobal('getFormErrorForField', (errorList, fieldName) => {
    if (errorList && errorList.length > 0) {
        return errorList.find(e => e.param === fieldName);
    }
});

// utility to get flash messages in templates (this can cause race conditions otherwise)
setGlobal('getFlash', (req, key, innerKey) => {
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
setGlobal('buildUrl', (sectionName, pageName) => {
    let localePrefix = getGlobal('localePrefix');
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

setGlobal('createHeroImage', function(opts) {
    return utilities.createHeroImage({
        small: opts.small,
        medium: opts.medium,
        large: opts.large,
        default: opts.default,
        caption: opts.caption
    });
});

// look up the current URL and rewrite to another locale
let getCurrentUrl = function(req, locale) {
    let currentPath = req.originalUrl;

    // is this an HTTPS request? make the URL protocol work
    let headerProtocol = req.get('X-Forwarded-Proto');
    let protocol = headerProtocol ? headerProtocol : req.protocol;
    let currentUrl = protocol + '://' + req.get('host') + currentPath;

    // is the current URL welsh or english?
    const CYMRU_URL = /\/welsh(\/|$)/;
    const IS_WELSH = currentUrl.match(CYMRU_URL) !== null;
    const IS_ENGLISH = currentUrl.match(CYMRU_URL) === null;

    // rewrite URL to requested language
    if (locale === 'cy' && !IS_WELSH) {
        // make this URL welsh
        currentUrl = protocol + '://' + req.get('host') + config.get('i18n.urlPrefix.cy') + currentPath;
    } else if (locale === 'en' && !IS_ENGLISH) {
        // un-welshify this URL
        currentUrl = currentUrl.replace(CYMRU_URL, '/');
    }

    // remove any trailing slashes (eg. /welsh/ => /welsh)
    currentUrl = utilities.stripTrailingSlashes(currentUrl);

    return currentUrl;
};

setGlobal('getCurrentUrl', getCurrentUrl);

module.exports = {
    get: getGlobal,
    set: setGlobal
};
