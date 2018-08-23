'use strict';
const express = require('express');

const appData = require('../../modules/appData');
const { createFormRouter } = require('../helpers/create-form-router');
const reachingCommunitiesForm = require('./reaching-communities/form-model');
const digitalFundingDemoForm = require('./digital-funding-demo/form-model');

function initFormRouter(formModel) {
    const router = express.Router();

    router.use((req, res, next) => {
        res.locals.isBilingual = false;
        next();
    });

    return createFormRouter({ router, formModel });
}

module.exports = ({ router }) => {
    router.get('/', (req, res) => {
        res.redirect('/');
    });

    router.use('/your-idea', initFormRouter(reachingCommunitiesForm));

    if (appData.isNotProduction) {
        router.use('/digital-funding-demo', initFormRouter(digitalFundingDemoForm));
    }

    return router;
};
