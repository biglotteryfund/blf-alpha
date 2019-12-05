'use strict';
const express = require('express');

const { isDev } = require('../../common/appData');

const router = express.Router();

router.use(function(req, res, next) {
    if (req.user) {
        res.locals.user = req.user;
    }

    res.locals.enableSiteSurvey = false;
    res.locals.bodyClass = 'has-static-header';
    next();
});

router.use('/', require('./dashboard'));

router.get('/your-idea*', function(req, res) {
    return res.redirect(res.locals.sectionUrl);
});

router.use('/awards-for-all', require('./awards-for-all'));
router.use('/your-funding-proposal', require('./standard-proposal'));

if (isDev) {
    router.use('/test-form', require('./test-form'));
}

router.use('/emails/unsubscribe', require('./unsubscribe'));
router.use('/handle-expiry', require('./expiry'));

module.exports = router;
