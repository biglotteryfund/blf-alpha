'use strict';
const express = require('express');
const moment = require('moment');

const routeHelpers = require('../route-helpers');
const appData = require('../../modules/appData');
const auth = require('../../middleware/authed');
const cached = require('../../middleware/cached');
const { toolsSecurityHeaders } = require('../../middleware/securityHeaders');
const surveysService = require('../../services/surveys');
const orderService = require('../../services/orders');
const materials = require('../../config/content/materials.json');
const { renderError } = require('../http-errors');

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

router.get('/status/pages', toolsSecurityHeaders(), (req, res) => {
    Promise.all([
        routeHelpers.getCanonicalRoutes({
            includeDraft: true
        }),
        routeHelpers.getCombinedRedirects({
            includeDraft: true
        }),
        routeHelpers.getVanityRedirects()
    ]).then(
        results => {
            const [canonicalRoutes, redirectRoutes, vanityRoutes] = results;
            const countRoutes = routeList => routeList.filter(route => route.live === true).length;

            const totals = {
                canonical: countRoutes(canonicalRoutes),
                vanity: countRoutes(vanityRoutes),
                redirects: countRoutes(redirectRoutes)
            };

            res.render('pages/tools/pagelist', {
                totals,
                canonicalRoutes,
                vanityRoutes,
                redirectRoutes
            });
        },
        err => {
            renderError(err);
        }
    );
});

const requiredAuthed = auth.requireAuthedLevel(5);

router.route('/tools/survey-results').get(cached.noCache, requiredAuthed, toolsSecurityHeaders(), (req, res) => {
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

router.route('/tools/order-stats').get(cached.noCache, requiredAuthed, toolsSecurityHeaders(), (req, res) => {
    orderService
        .getAllOrders()
        .then(orderData => {
            let items = materials.items;
            res.locals.findItemByCode = code => items.find(i => i.products.some(p => p.code === code));

            res.render('pages/tools/orders', {
                data: orderData,
                materials: materials
            });
        })
        .catch(err => {
            res.send(err);
        });
});

module.exports = router;
