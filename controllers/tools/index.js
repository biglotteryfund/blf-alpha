'use strict';
const path = require('path');
const express = require('express');

const { requireStaffAuth } = require('../../middleware/authed');
const { noCache } = require('../../middleware/cached');
const { noindex } = require('../../middleware/robots');

const router = express.Router();

router.use(noCache, noindex);

/**************************************
 * Public Tools
 **************************************/

router.use('/seed', require('./seed'));

/**************************************
 * Staff Tools
 **************************************/

// Staff only routes
router.use(requireStaffAuth);

router.route('/').get((req, res) => {
    res.render(path.resolve(__dirname, './views/index'), {
        user: req.user
    });
});

router.use('/feedback-results', require('./feedback'));
router.use('/survey-results', require('./surveys'));
router.use('/order-stats', require('./orders'));

module.exports = router;
