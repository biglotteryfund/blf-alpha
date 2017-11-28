'use strict';
const express = require('express');
const router = express.Router();
const moment = require('moment');
const path = require('path');
const fs = require('fs');
const generateSchema = require('generate-schema');

const globals = require('../../modules/boilerplate/globals');
const routes = require('../routes');
const models = require('../../models/index');
const auth = require('../../modules/authed');
const cached = require('../../middleware/cached');

const LAUNCH_DATE = moment();

const USER_LEVEL_REQUIRED = 5;

const localeFiles = {
    en: '../../config/locales/en.json',
    cy: '../../config/locales/cy.json'
};

// status page used by load balancer
router.get('/status', cached.noCache, (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.setHeader('Content-Type', 'application/json');
    const appData = globals.get('appData');
    res.send({
        APP_ENV: process.env.NODE_ENV,
        DEPLOY_ID: appData.deployId,
        COMMIT_ID: appData.commitId,
        BUILD_NUMBER: appData.buildNumber,
        START_DATE: LAUNCH_DATE.format('dddd, MMMM Do YYYY, h:mm:ss a'),
        UPTIME: LAUNCH_DATE.toNow(true)
    });
});

// pagelist
router.get('/status/pages', (req, res) => {
    const totals = {
        canonical: [],
        aliases: [],
        vanityRedirects: routes.vanityRedirects.filter(r => r.aliasOnly).map(r => r.path),
        redirectedPages: routes.vanityRedirects.filter(r => !r.aliasOnly).map(r => r.path)
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

    res.render('pages/tools/pagelist', {
        routes: routes.sections,
        vanityRedirects: routes.vanityRedirects,
        totals: totals
    });
});

router.route('/tools/survey-results/').get(auth.requireAuthedLevel(USER_LEVEL_REQUIRED), cached.noCache, (req, res) => {
    models.Survey.findAll({
        include: [
            {
                model: models.SurveyChoice,
                as: 'choices',
                required: true,
                include: [
                    {
                        model: models.SurveyResponse,
                        as: 'responses',
                        required: true
                    }
                ]
            }
        ]
    })
        .then(surveys => {
            res.render('pages/tools/surveys', {
                surveys: surveys
            });
        })
        .catch(err => {
            res.send(err);
        });
});

// language file editor tool
router
    .route('/tools/locales/')
    .get(auth.requireAuthedLevel(USER_LEVEL_REQUIRED), cached.noCache, (req, res) => {
        res.render('pages/tools/langEditor', {
            user: req.user
        });
    })
    .post(auth.requireAuthedLevel(USER_LEVEL_REQUIRED), (req, res) => {
        // fetch these each time
        const locales = {
            en: JSON.parse(fs.readFileSync(path.join(__dirname, localeFiles.en), 'utf8')),
            cy: JSON.parse(fs.readFileSync(path.join(__dirname, localeFiles.cy), 'utf8'))
        };
        res.send({
            editors: [
                {
                    name: 'English',
                    code: 'en',
                    json: locales.en,
                    schema: generateSchema.json(locales.en)
                },
                {
                    name: 'Welsh',
                    code: 'cy',
                    json: locales.cy,
                    schema: generateSchema.json(locales.cy)
                }
            ]
        });
    });

// update a language file
router.post('/tools/locales/update/', auth.requireAuthedLevel(USER_LEVEL_REQUIRED), (req, res) => {
    const json = req.body;
    let validKeys = ['en', 'cy'];
    let failedUpdates = [];

    validKeys.forEach(locale => {
        if (json[locale]) {
            let jsonToWrite = JSON.stringify(json[locale], null, 4);
            try {
                let filePath = path.join(__dirname, `../../config/locales/${locale}.json`);
                fs.writeFileSync(filePath, jsonToWrite);
            } catch (err) {
                failedUpdates.push(locale);
                return console.error(`Error saving ${locale} language`, err);
            }
        }
    });

    res.send({
        error: failedUpdates.length > 0 ? failedUpdates : false
    });
});

module.exports = router;
