'use strict';
const express = require('express');

const { toolsSecurityHeaders } = require('../../middleware/securityHeaders');
const auth = require('../../middleware/authed');
const cached = require('../../middleware/cached');
const feedbackService = require('../../services/feedback');
const materials = require('../../config/content/materials.json');
const orderService = require('../../services/orders');
const surveysService = require('../../services/surveys');

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

router.route('/order-stats').get((req, res) => {
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
