'use strict';
const express = require('express');

const { createFormRouter } = require('../helpers/create-form-router');
const reachingCommunitiesForm = require('./reaching-communities/form-model');
const buildingConnectionsForm = require('./building-connections/form-model');
const appData = require('../../modules/appData');

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
    router.use('/building-connections', initFormRouter(buildingConnectionsForm));

    return router;
};
