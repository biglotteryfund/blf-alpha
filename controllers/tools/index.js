'use strict';
const path = require('path');
const express = require('express');
const moment = require('moment');
const config = require('config');
const basicAuth = require('express-basic-auth');

const cookies = config.get('cookies');

const { buildSecurityMiddleware } = require('../../middleware/securityHeaders');
const { requireStaffAuth } = require('../../middleware/authed');
const { noCache } = require('../../middleware/cached');
const { noindex } = require('../../middleware/robots');
const { REBRAND_SECRET, REBRAND_TEST_PASSWORD } = require('../../modules/secrets');

const router = express.Router();

const toggleRebrand = mode => (req, res) => {
    const duration = mode === 'staff' ? moment.duration(1, 'weeks') : moment.duration(1, 'day');
    const data = {
        secret: REBRAND_SECRET,
        mode: mode
    };
    if (req.params.switch === 'on') {
        res.cookie(cookies.rebrand, data, {
            maxAge: duration.asMilliseconds(),
            httpOnly: true
        });
    } else {
        res.clearCookie(cookies.rebrand);
    }
    res.redirect('/');
};

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

console.log(REBRAND_TEST_PASSWORD);
// Temporary public rebrand test mode (can be removed post-testing)
router.route('/testing/rebrand/:switch').get(
    basicAuth({
        users: {
            blftest: REBRAND_TEST_PASSWORD
        },
        challenge: true
    }),
    toggleRebrand('public')
);

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

router.route('/rebrand/:switch').get(toggleRebrand('staff'));

router.use('/feedback-results', require('./feedback'));
router.use('/survey-results', require('./surveys'));
router.use('/order-stats', require('./orders'));

module.exports = router;
