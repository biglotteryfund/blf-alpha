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

    router.get('/building-connections', (req, res) => {
        res.render('pages/apply/building-connections/startpage-closed', {
            title: 'Building Connections Fund'
        });
    });

    router.all('/building-connections/*', (req, res) => {
        res.redirect(`${req.baseUrl}/building-connections`);
    });

    if (appData.isNotProduction) {
        router.use('/digital-funding-demo', initFormRouter(digitalFundingDemoForm));
    }

    return router;
};
