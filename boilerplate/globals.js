'use strict';
const fs = require('fs');
const path = require('path');
const config = require('config');
const sassConfig = require('../config/sass.json');

module.exports = function (app) {
    // extract deploy ID from AWS (where provided)
    let deploymentData;
    try {
        deploymentData = JSON.parse(fs.readFileSync(path.join(__dirname, '../config/deploy.json'), 'utf8'));
    } catch (e) {
        console.info('deploy.json not found -- are you in DEV mode?');
    }
    const appEnv = process.env.NODE_ENV || 'dev';
    app.locals.deployId = (deploymentData && deploymentData.deployId) ? deploymentData.deployId : 'DEV';
    app.locals.buildNumber = (deploymentData && deploymentData.buildNumber) ? deploymentData.buildNumber : 'DEV';
    app.locals.IS_DEV = appEnv === 'dev';
    app.locals.environment = appEnv;
    app.locals.config = config;

    app.locals.metadata = {
        title: config.get('meta.title'),
        description: config.get('meta.description'),
        themeColour: sassConfig.themeColour
    };

    app.locals.disableExternal = config.get('disableExternal');

    app.locals.getFormErrorForField = function (errorList, fieldName) {
        if (errorList && errorList.length > 0) {
            return errorList.find(e => e.param === fieldName);
        }
    };

    // get URL middleware
    app.use(function(req, res, next) {

        req.app.locals.getCurrentUrl = function (locale) {
            let protocol = (appEnv === 'production') ? 'https' : req.protocol;
            let currentUrl = protocol + "://" + req.get('host') + req.originalUrl;
            const CYMRU_URL = /\/welsh\//;
            const IS_WELSH = (currentUrl.match(CYMRU_URL) !== null);
            const IS_ENGLISH = (currentUrl.match(CYMRU_URL) === null);
            if (locale === 'cy' && !IS_WELSH) { // make this URL welsh
                currentUrl = req.protocol + "://" + req.get('host') + config.get('i18n.urlPrefix.cy') + req.originalUrl;
            } else if (locale === 'en' && !IS_ENGLISH) { // un-welshify this URL
                currentUrl = currentUrl.replace(CYMRU_URL, '/');
            }
            return currentUrl;
        };

        app.get('engineEnv').addGlobal('getCurrentUrl', req.app.locals.getCurrentUrl);
        return next();
    });

};