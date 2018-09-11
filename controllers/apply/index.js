'use strict';
const express = require('express');

const appData = require('../../modules/appData');

const formRouter = require('./form-router');
const reachingCommunitiesForm = require('./reaching-communities/form-model');
const digitalFundingDemoForm = require('./digital-funding-demo/form-model');


const router = express.Router();

router.get('/', (req, res) => {
    res.redirect('/');
});

router.use('/your-idea', formRouter(reachingCommunitiesForm));

if (appData.isNotProduction) {
    router.use('/digital-funding-demo-1', formRouter(digitalFundingDemoForm(1)));
    router.use('/digital-funding-demo-2', formRouter(digitalFundingDemoForm(2)));
}

module.exports = router;
