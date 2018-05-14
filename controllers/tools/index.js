'use strict';
const express = require('express');

const { toolsSecurityHeaders } = require('../../middleware/securityHeaders');
const auth = require('../../middleware/authed');
const cached = require('../../middleware/cached');
const feedbackService = require('../../services/feedback');
const orderService = require('../../services/orders');
const surveysService = require('../../services/surveys');
const { injectMerchandiseCustom } = require('../../controllers/funding/materials-helpers');

const pagelistRouter = require('./pagelist');
const seedRouter = require('./seed');

const router = express.Router();

router.use(cached.noCache, toolsSecurityHeaders());

/**************************************
 * Public / Unauthed Tools
 **************************************/

pagelistRouter.init({
    router
});

seedRouter.init({
    router
});

/**************************************
 * Internal / Authed Tools
 **************************************/

router.use(auth.requireAuthedLevel(5));

router.route('/feedback-results').get((req, res) => {
    feedbackService
        .findAll()
        .then(feedback => {
            res.render('pages/tools/feedback-results', {
                feedback: feedback
            });
        })
        .catch(err => {
            res.send(err);
        });
});

router.route('/survey-results').get((req, res) => {
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

router.route('/order-stats').get(injectMerchandiseCustom({locale: 'en', showAll: true}), (req, res) => {
    orderService
        .getAllOrders()
        .then(orderData => {
            const materials = res.locals.availableItems;

            res.locals.getItemName = code => {
                // we have to search twice here because we only know the product code
                // so we have to find the material first (for its name) then check the product
                const material = materials.find(i => i.products.find(j => j.code === code));
                if (!material) {
                    return 'Unknown item';
                }
                const product = material.products.find(p => p.code === code);
                return product.name ? product.name : material.title;
            };

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
