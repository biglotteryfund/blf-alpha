'use strict';
const path = require('path');
const express = require('express');
const router = express.Router();

const { buildSecurityMiddleware } = require('../../middleware/securityHeaders');
const { requireStaffAuth } = require('../../middleware/authed');
const { noCache } = require('../../middleware/cached');
const { noindex } = require('../../middleware/robots');

router.use(
    noCache,
    noindex,
    buildSecurityMiddleware({
        defaultSrc: [
            "'self'",
            'maxcdn.bootstrapcdn.com',
            'ajax.googleapis.com',
            'cdnjs.cloudflare.com',
            'cdn.jsdelivr.net'
        ]
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
        { label: 'View a list of all published pages', href: '/tools/pages' },
        { label: 'View micro-survey results', href: '/tools/survey-results' },
        { label: 'View feedback results', href: '/tools/feedback-results' },
        { label: 'View recent materials order stats', href: '/tools/order-stats' }
    ];

    res.render(path.resolve(__dirname, './views/index'), {
        links,
        user: req.user
    });
});

router.route('/rebrand/:switch').get((req, res) => {
    req.session['tnlcf-rebrand-2019'] = req.params.switch === 'on';
    req.session.save(() => {
        res.redirect('/');
    });
});

router.use('/feedback-results', require('./feedback'));
router.use('/survey-results', require('./surveys'));
router.use('/order-stats', require('./orders'));

module.exports = router;
