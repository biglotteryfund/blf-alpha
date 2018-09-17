'use strict';
const path = require('path');
const express = require('express');
const router = express.Router();

const { toolsSecurityHeaders } = require('../../middleware/securityHeaders');
const { requireAuthedLevel } = require('../../middleware/authed');
const { noCache } = require('../../middleware/cached');
const { noindex } = require('../../middleware/robots');

router.use(noCache, noindex, toolsSecurityHeaders());

/**************************************
 * Public / Unauthed Tools
 **************************************/

router.use('/seed', require('./seed'));
router.use('/pages', require('./pagelist'));

/**************************************
 * Internal / Authed Tools
 **************************************/

router.use(requireAuthedLevel(5));

router.route('/').get((req, res) => {
    const links = [
        { label: 'View a list of all published pages', href: '/tools/pages' },
        { label: 'View micro-survey results', href: '/tools/survey-results' },
        { label: 'View feedback results', href: '/tools/feedback-results' },
        { label: 'View recent materials order stats', href: '/tools/order-stats' }
    ];

    res.render(path.resolve(__dirname, './views/index'), { links });
});

router.use('/feedback-results', require('./feedback'));
router.use('/survey-results', require('./surveys'));
router.use('/order-stats', require('./orders'));

module.exports = router;
