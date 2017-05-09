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
    const appEnv = process.env.NODE_ENV || 'DEV';
    app.locals.deployId = (deploymentData && deploymentData.deployId) ? deploymentData.deployId : 'DEV';
    app.locals.buildNumber = (deploymentData && deploymentData.buildNumber) ? deploymentData.buildNumber : 'DEV';
    app.locals.IS_DEV = appEnv.toLowerCase() === 'dev';

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
        req.app.locals.getCurrentUrl = function () {
            return req.protocol + "://" + req.get('host') + req.originalUrl;
        };
        return next();
    });

};