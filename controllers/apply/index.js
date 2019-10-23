'use strict';
const express = require('express');
const features = require('config').get('features');

const { isNotProduction } = require('../../common/appData');

const router = express.Router();

router.use(function(req, res, next) {
    if (req.user) {
        res.locals.user = req.user;
    }

    res.locals.enableSiteSurvey = false;
    res.locals.bodyClass = 'has-static-header';
    next();
});

if (features.enableNewApplicationDashboards) {
    router.use('/', require('./dashboard'));
    router.get('/awards-for-all', (req, res) => res.redirect(req.baseUrl));
    router.get('/get-advice', (req, res) => res.redirect(req.baseUrl));
} else {
    router.get('/', (req, res) => res.redirect('/'));
}

router.use('/your-idea', require('./reaching-communities'));
router.use('/awards-for-all', require('./awards-for-all'));

if (isNotProduction) {
    router.use('/get-advice', require('./get-advice'));
}

router.use('/emails/unsubscribe', require('./unsubscribe'));
router.use('/handle-expiry', require('./expiry'));

module.exports = router;
