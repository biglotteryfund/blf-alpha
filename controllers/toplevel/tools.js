'use strict';
const express = require('express');
const moment = require('moment');

const routes = require('../routes');
const auth = require('../../middleware/authed');
const cached = require('../../middleware/cached');
const appData = require('../../modules/appData');
const surveysService = require('../../services/surveys');

const router = express.Router();

const LAUNCH_DATE = moment();
const USER_LEVEL_REQUIRED = 5;

// status page used by load balancer
router.get('/status', cached.noCache, (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.setHeader('Content-Type', 'application/json');

    res.send({
        APP_ENV: appData.environment,
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
                    page.aliases.forEach(alias => totals.aliases.push(alias));
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
    surveysService
        .findAll()
        .then(surveys => {
            res.render('pages/tools/surveys', {
                surveys: surveys
            });
        })
        .catch(err => {
            res.send(err);
        });
});

module.exports = router;
