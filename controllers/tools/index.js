'use strict';
const express = require('express');

const { renderError } = require('../http-errors');
const { toolsSecurityHeaders } = require('../../middleware/securityHeaders');
const auth = require('../../middleware/authed');
const cached = require('../../middleware/cached');
const materials = require('../../config/content/materials.json');
const orderService = require('../../services/orders');
const routeHelpers = require('../route-helpers');
const surveysService = require('../../services/surveys');

const router = express.Router();

const seedRouter = require('./seed');

router.use(toolsSecurityHeaders());

router.get('/pages', async (req, res) => {
    try {
        const canonicalRoutes = await routeHelpers.getCanonicalRoutes({ includeDraft: true });
        const redirectRoutes = await routeHelpers.getCombinedRedirects({ includeDraft: true });
        const vanityRoutes = await routeHelpers.getVanityRedirects();

        const countRoutes = routeList => routeList.filter(route => route.live === true).length;

        const totals = {
            canonical: countRoutes(canonicalRoutes),
            redirects: countRoutes(redirectRoutes),
            vanity: countRoutes(vanityRoutes)
        };

        res.render('pages/tools/pagelist', {
            totals,
            canonicalRoutes,
            redirectRoutes,
            vanityRoutes
        });
    } catch (err) {
        renderError(err);
    }
});

const requiredAuthed = auth.requireAuthedLevel(5);

router.route('/survey-results').get(cached.noCache, requiredAuthed, (req, res) => {
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

router.route('/order-stats').get(cached.noCache, requiredAuthed, (req, res) => {
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

seedRouter.init({
    router
});

module.exports = router;
