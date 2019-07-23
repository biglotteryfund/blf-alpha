'use strict';
const express = require('express');
const features = require('config').get('features');

const { renderNotFound } = require('../errors');
const digitalFund = require('./digital-fund');
const reachingCommunities = require('./reaching-communities');

const router = express.Router();

router.get('/', (req, res) => res.redirect('/'));

/**
 * Reaching Communities
 */
router.use('/your-idea', reachingCommunities);

/**
 * Digital Fund
 */
if (features.enableDigitalFundApplications) {
    router.use('/digital-fund-strand-1', digitalFund.strand1);
    router.use('/digital-fund-strand-2', digitalFund.strand2);
} else {
    const redirectToProgramme = (req, res) =>
        res.redirect('/funding/programmes/digital-fund');
    router.use('/digital-fund-strand-1', redirectToProgramme);
    router.use('/digital-fund-strand-2', redirectToProgramme);
}

/**
 * Awards for All
 * Guard access with feature flag
 */
router.use(
    '/awards-for-all',
    function(req, res, next) {
        if (res.locals.enableAwardsForAllApplications) {
            next();
        } else {
            renderNotFound(req, res);
        }
    },
    require('./awards-for-all')
);

module.exports = router;
