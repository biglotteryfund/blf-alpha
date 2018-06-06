'use strict';
const express = require('express');

const { injectMerchandise } = require('../../controllers/funding/materials-helpers');
const { TOOLS_CMS_ADMIN_URL, TOOLS_ANALYTICS_DASHBOARD_URL, TOOLS_DATASTUDIO_URL } = require('../../modules/secrets');
const { toolsSecurityHeaders } = require('../../middleware/securityHeaders');
const auth = require('../../middleware/authed');
const cached = require('../../middleware/cached');
const feedbackService = require('../../services/feedback');
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

router.route('/').get((req, res) => {
    const links = [
        { label: 'View a list of all published pages', href: '/tools/pages' },
        { label: 'View micro-survey results', href: '/tools/survey-results' },
        { label: 'View feedback results', href: '/tools/feedback-results' },
        { label: 'View recent materials order stats', href: '/tools/order-stats' },
        { label: 'View the Reaching Communities & Partnerships data dashboard', href: TOOLS_DATASTUDIO_URL },
        { label: 'Access Google Analytics dashboard', href: TOOLS_ANALYTICS_DASHBOARD_URL },
        { label: 'Log in to the CMS', href: TOOLS_CMS_ADMIN_URL }
    ];

    res.render('tools/index', { links });
});

router.route('/feedback-results').get(async (req, res, next) => {
    try {
        const feedback = await feedbackService.findAll();
        res.render('tools/feedback-results', { feedback });
    } catch (error) {
        next(error);
    }
});

router.route('/survey-results').get(async (req, res, next) => {
    try {
        const surveys = await surveysService.findAll();
        res.render('tools/surveys', { surveys });
    } catch (error) {
        next(error);
    }
});

router.route('/order-stats').get(injectMerchandise({ locale: 'en', showAll: true }), async (req, res, next) => {
    try {
        const orderData = await orderService.getAllOrders();
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

        res.render('tools/orders', {
            data: orderData,
            materials: materials
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
