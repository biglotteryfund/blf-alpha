'use strict';
const path = require('path');
const express = require('express');
const router = express.Router();

const { toolsSecurityHeaders } = require('../../middleware/securityHeaders');
const { requireAuthedLevel } = require('../../middleware/authed');
const { noCache } = require('../../middleware/cached');

router.use(noCache, toolsSecurityHeaders());

/**************************************
 * Public / Unauthed Tools
 **************************************/

router.use('/seed', require('./seed'));

/**************************************
 * Internal / Authed Tools
 **************************************/

router.use(requireAuthedLevel(5));

router.route('/').get((req, res) => {
    const links = [
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
