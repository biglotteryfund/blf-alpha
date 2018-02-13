'use strict';
const express = require('express');
const moment = require('moment');

const routes = require('../routes');
const appData = require('../../modules/appData');
const auth = require('../../middleware/authed');
const cached = require('../../middleware/cached');
const { toolsSecurityHeaders } = require('../../middleware/securityHeaders');
const surveysService = require('../../services/surveys');

const router = express.Router();

// status page used by load balancer
const LAUNCH_DATE = moment();
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
        vanityRedirects: routes.vanityRedirects.map(r => r.path)
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

const requiredAuthed = auth.requireAuthedLevel(5);
router.route('/tools/survey-results/').get(requiredAuthed, toolsSecurityHeaders(), cached.noCache, (req, res) => {
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
