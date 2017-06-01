'use strict';
const express = require('express');
const router = express.Router();
const moment = require('moment');

const globals = require('../boilerplate/globals');
const routes = require('./routes');

const LAUNCH_DATE = moment();

const locales = {
    en: require('../locales/en.json'),
    cy: require('../locales/cy.json'),
};

router.get('/', (req, res, next) => {
    // don't cache this page!
    res.cacheControl = { maxAge: 0 };
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.setHeader('Content-Type', 'application/json');
    const appData = globals.get('appData');
    res.send({
        'APP_ENV': process.env.NODE_ENV,
        'DEPLOY_ID': appData.deployId,
        'BUILD_NUMBER': appData.buildNumber,
        'START_DATE': LAUNCH_DATE.format("dddd, MMMM Do YYYY, h:mm:ss a"),
        'UPTIME': LAUNCH_DATE.toNow(true)
    });
});

router.get('/pages', (req, res, next) => {
    res.render('pagelist', {
        routes: routes.sections,
        vanityRedirects: routes.vanityRedirects
    });
});

router.route('/locales/:locale')
    .get((req, res, next) => {
        if (['en', 'cy'].indexOf(req.params.locale) !== -1) {
            let l = req.params.locale;
            res.render('langEditor', {
                json: locales[l],
                locale: l,
                locales: locales
            });
        } else {
            res.redirect('/');
        }
    }).post((req, res, next) => {
        if (['en', 'cy'].indexOf(req.params.locale) !== -1) {
            let l = req.params.locale;
            res.send(locales[l]);
        } else {
            res.send({
                error: true
            });
        }
    });

module.exports = router;
