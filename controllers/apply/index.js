'use strict';
const express = require('express');
const router = express.Router();

const appData = require('../../common/appData');

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

// Redirect renamed Awards For All paths to more generic under10k route
router.get('/awards-for-all*', function (req, res) {
    const newPath = req.originalUrl.replace('/awards-for-all/', '/under-10k/');
    res.redirect(newPath);
});

router.use('/under-10k', require('./under10k'));
router.use('/your-funding-proposal', require('./standard-proposal'));

if (appData.isNotProduction) {
    router.use('/contacts-next', require('./contacts-next'));
}

router.use('/emails/unsubscribe', require('./expiries/unsubscribe-router'));
router.use('/handle-expiry', require('./expiries/expiry-router'));

module.exports = router;
