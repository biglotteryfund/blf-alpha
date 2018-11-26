'use strict';
const express = require('express');

const { initFormRouter } = require('./form-router');
const appData = require('../../modules/appData');

const digitalFundForm = require('./digital-fund/form-model');
const reachingCommunitiesForm = require('./reaching-communities/form-model');
const buildingConnectionsTempForm = require('./building-connections/form-model');

const router = express.Router();

router.get('/', (req, res) => res.redirect('/'));
router.use('/digital-fund-strand-1', initFormRouter(digitalFundForm.strand1));
router.use('/digital-fund-strand-2', initFormRouter(digitalFundForm.strand2));
router.use('/your-idea', initFormRouter(reachingCommunitiesForm));

if (appData.isNotProduction) {
    router.use('/building-connections-temporary', initFormRouter(buildingConnectionsTempForm));
}

module.exports = router;
