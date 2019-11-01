'use strict';
const express = require('express');

const { renderNotFound } = require('../errors');

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

router.use('/your-idea', require('./reaching-communities'));
router.use('/awards-for-all', require('./awards-for-all'));

router.use(
    '/your-funding-proposal',
    function(req, res, next) {
        if (res.locals.enableStandardApplications) {
            next();
        } else {
            renderNotFound(req, res);
        }
    },
    require('./standard-proposal')
);

router.use('/emails/unsubscribe', require('./unsubscribe'));
router.use('/handle-expiry', require('./expiry'));

module.exports = router;
