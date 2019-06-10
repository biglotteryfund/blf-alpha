'use strict';
const path = require('path');
const express = require('express');

const { requireStaffAuth } = require('../../middleware/authed');
const { noCache } = require('../../middleware/cached');
const { noindex } = require('../../middleware/robots');

const router = express.Router();

router.use(noCache, noindex, requireStaffAuth, function(req, res, next) {
    res.locals.isBilingual = false;
    res.locals.enableSiteSurvey = false;
    res.locals.bodyClass = 'has-static-header'; // No hero images on tools pages
    res.locals.user = req.user;
    res.locals.breadcrumbs = [{ label: 'Tools', url: req.baseUrl }];
    next();
});

router.route('/').get((req, res) => {
    res.render(path.resolve(__dirname, './views/index'), {
        title: 'Staff tools'
    });
});

router.use('/feedback-results', require('./feedback'));
router.use('/survey-results', require('./surveys'));
router.use('/order-stats', require('./orders'));

module.exports = router;
