'use strict';
const express = require('express');
const router = express.Router();

router.use(function (req, res, next) {
    if (req.user) {
        res.locals.user = req.user;
    }

    res.locals.enableSiteSurvey = false;
    res.locals.bodyClass = 'has-static-header';
    next();
});

router.use('/', require('./dashboard'));

router.get('/your-idea*', function (req, res) {
    return res.redirect(res.locals.sectionUrl);
});

router.use('/awards-for-all', require('./under10k'));
router.use('/your-funding-proposal', require('./standard-proposal'));

router.use('/emails/unsubscribe', require('./expiries/unsubscribe-router'));
router.use('/handle-expiry', require('./expiries/expiry-router'));

module.exports = router;
