'use strict';
const path = require('path');
const express = require('express');

const { buildSecurityMiddleware } = require('../../middleware/securityHeaders');
const { requireStaffAuth } = require('../../middleware/authed');
const { noCache } = require('../../middleware/cached');
const { noindex } = require('../../middleware/robots');

const router = express.Router();

router.use(
    noCache,
    noindex,
    buildSecurityMiddleware({
        defaultSrc: ["'self'", 'maxcdn.bootstrapcdn.com', 'ajax.googleapis.com', 'cdnjs.cloudflare.com']
    })
);

/**************************************
 * Public / Unauthed Tools
 **************************************/

router.use('/seed', require('./seed'));
router.use('/pages', require('./pagelist'));

/**************************************
 * Internal / Authed Tools
 **************************************/

// Staff only routes
router.use(requireStaffAuth);

router.route('/').get((req, res) => {
    const links = [
        {
            href: '/tools/pages',
            label: 'Page list',
            description: 'View a list of all published pages'
        },
        {
            href: '/tools/survey-results',
            label: 'Global survey results',
            description: 'Responses to the “Did you find what you were looking for?” survey on all pages'
        },
        {
            href: '/tools/feedback-results',
            label: 'Inline feedback results',
            description: 'Responses to any inline feedback surveys (e.g. post-application feedback)'
        },
        {
            href: '/tools/order-stats',
            label: 'Material orders',
            description: 'Statistics on recent material orders'
        }
    ];

    res.render(path.resolve(__dirname, './views/index'), {
        links,
        user: req.user
    });
});

router.use('/feedback-results', require('./feedback'));
router.use('/survey-results', require('./surveys'));
router.use('/order-stats', require('./orders'));

module.exports = router;
