'use strict';
const express = require('express');

const { toolsSecurityHeaders } = require('../../middleware/securityHeaders');
const auth = require('../../middleware/authed');
const cached = require('../../middleware/cached');
const feedbackService = require('../../services/feedback');
const materials = require('../../config/content/materials.json');
const orderService = require('../../services/orders');
const surveysService = require('../../services/surveys');

const router = express.Router();

const pagelistRouter = require('./pagelist');
const seedRouter = require('./seed');

router.use(toolsSecurityHeaders());

pagelistRouter.init({
    router
});

const requiredAuthed = auth.requireAuthedLevel(5);

router.route('/feedback-results').get(cached.noCache, requiredAuthed, (req, res) => {
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
