'use strict';
const express = require('express');
const config = require('config');

const { initFormRouter } = require('./form-router');
const appData = require('../../modules/appData');

const digitalFundForm = require('./digital-fund/form-model');
const reachingCommunitiesForm = require('./reaching-communities/form-model');
const buildingConnectionsTempForm = require('./building-connections/form-model');

const features = config.get('features');

const router = express.Router();

router.get('/', (req, res) => res.redirect('/'));
router.use('/your-idea', initFormRouter(reachingCommunitiesForm));

if (features.enableDigitalFundApplications) {
    router.use('/digital-fund-strand-1', initFormRouter(digitalFundForm.strand1));
    router.use('/digital-fund-strand-2', initFormRouter(digitalFundForm.strand2));
} else {
    const redirectToProgramme = (req, res) => res.redirect('/funding/programmes/digital-fund');
    router.use('/digital-fund-strand-1', redirectToProgramme);
    router.use('/digital-fund-strand-2', redirectToProgramme);
}

if (appData.isNotProduction) {
    router.use('/building-connections-temporary', initFormRouter(buildingConnectionsTempForm));
}

module.exports = router;
