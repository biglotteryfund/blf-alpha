'use strict';
const express = require('express');
const router = express.Router();
const moment = require('moment');
const path = require('path');
const fs = require('fs');
const generateSchema = require('generate-schema');

const globals = require('../boilerplate/globals');
const routes = require('./routes');

const LAUNCH_DATE = moment();

const localeFiles = {
    en: '../locales/en.json',
    cy: '../locales/cy.json'
};

const locales = {
    en: require(localeFiles.en),
    cy: require(localeFiles.cy)
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

    const totals = {
        canonical: [],
        aliases: [],
        vanityRedirects: routes.vanityRedirects.map(r => r.path)
    };

    for (let s in routes.sections) {
        let section = routes.sections[s];
        for (let p in section.pages) {
            let page = section.pages[p];
            if (page.live) {
                totals.canonical.push(page.name);
                if (page.aliases) {
                    page.aliases.forEach(p => totals.aliases.push(p));
                }
            }
        }
    }

    res.render('pagelist', {
        routes: routes.sections,
        vanityRedirects: routes.vanityRedirects,
        totals: totals
    });
});

// only allow these routes in dev
if (globals.get('appData').IS_DEV) {

    router.route('/locales/')
        .get((req, res, next) => {
            res.render('langEditor', {});
        }).post((req, res, next) => {
        res.send({
            editors: [
                {
                    name: "English",
                    code: 'en',
                    json: locales.en,
                    schema: generateSchema.json(locales.en)
                },
                {
                    name: "Welsh",
                    code: 'cy',
                    json: locales.cy,
                    schema: generateSchema.json(locales.cy)
                }
            ]
        });
    });

    router.post('/locales/update/', (req, res, next) => {

        const json = req.body;
        let validKeys = ['en', 'cy'];
        let failedUpdates = [];

        validKeys.forEach(locale => {
            if (json[locale]) {
                let jsonToWrite = JSON.stringify(json[locale], null, 4);
                try {
                    let filePath = path.join(__dirname, `../locales/${locale}.json`);
                    fs.writeFileSync(filePath, jsonToWrite);
                } catch (err) {
                    failedUpdates.push(locale);
                    return console.error(`Error saving ${locale} language`, err);
                }
            }
        });

        res.send({
            error: (failedUpdates.length > 0) ? failedUpdates : false
        });

    });

}

module.exports = router;
