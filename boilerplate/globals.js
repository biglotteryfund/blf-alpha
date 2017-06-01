'use strict';
const app = require('../server');
const fs = require('fs');
const path = require('path');
const config = require('config');
const sassConfig = require('../config/sass.json');
const routes = require('../routes/routes');

const getGlobal = (name) => {
    return app.get('engineEnv').getGlobal(name);
};

const setGlobal = (name, value) => {
    return app.get('engineEnv').addGlobal(name, value);
};

// extract deploy ID from AWS (where provided)
let deploymentData;
try {
    deploymentData = JSON.parse(fs.readFileSync(path.join(__dirname, '../config/deploy.json'), 'utf8'));
} catch (e) {
    console.info('deploy.json not found -- are you in DEV mode?');
}

const appEnv = process.env.NODE_ENV || 'dev';

// store some app-wide config data
setGlobal('appData', {
    deployId: (deploymentData && deploymentData.deployId) ? deploymentData.deployId : 'DEV',
    buildNumber: (deploymentData && deploymentData.buildNumber) ? deploymentData.buildNumber : 'DEV',
    IS_DEV: appEnv === 'dev',
    environment: appEnv,
    config: config // @TODO is this being used?
});

// configure meta tags
setGlobal('metadata', {
    title: config.get('meta.title'),
    description: config.get('meta.description'),
    themeColour: sassConfig.themeColour
});

// add a toggle for offline dev to skip loading external assets
setGlobal('disableExternal', config.get('disableExternal'));

// a global function for finding errors from a form array
setGlobal('getFormErrorForField', (errorList, fieldName) => {
    if (errorList && errorList.length > 0) {
        return errorList.find(e => e.param === fieldName);
    }
});

// linkbuilder function for helping with routes
setGlobal('buildUrl', (sectionName, pageName) => {
    let localePrefix = getGlobal('localePrefix');
    let section = routes.sections[sectionName];
    try {
        let page = section.pages[pageName];
        return localePrefix + section.path + page.path;
    }
    catch (e) {
        // pages from the "global" section have no prefix
        // and aliases don't drop into the above block
        const IS_GLOBAL = (sectionName === 'global');
        let url = IS_GLOBAL ? '' : '/';
        if (!IS_GLOBAL) { url += sectionName; }
        if (pageName) { url += pageName; }
        return localePrefix + url;
    }
});

// look up the current URL and rewrite to another locale
let getCurrentUrl = (req, locale) => {
    // is this an HTTPS request? make the URL protocol work
    let headerProtocol = req.get('X-Forwarded-Proto');
    let protocol = (headerProtocol) ? headerProtocol : req.protocol;
    let currentUrl = protocol + "://" + req.get('host') + req.originalUrl;
    // is the current URL welsh or english?
    const CYMRU_URL = /\/welsh\//;
    const IS_WELSH = (currentUrl.match(CYMRU_URL) !== null);
    const IS_ENGLISH = (currentUrl.match(CYMRU_URL) === null);
    // rewrite URL to requested language
    if (locale === 'cy' && !IS_WELSH) { // make this URL welsh
        currentUrl = protocol + "://" + req.get('host') + config.get('i18n.urlPrefix.cy') + req.originalUrl;
    } else if (locale === 'en' && !IS_ENGLISH) { // un-welshify this URL
        currentUrl = currentUrl.replace(CYMRU_URL, '/');
    }
    return currentUrl;
};

// get URL middleware
app.use((req, res, next) => {
    setGlobal('getCurrentUrl', (locale) => getCurrentUrl(req, locale));
    return next();
});

module.exports = {
    get: getGlobal,
    set: setGlobal
};