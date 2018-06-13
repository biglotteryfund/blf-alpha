'use strict';
const express = require('express');

const { createFormRouter } = require('../helpers/create-form-router');
const reachingCommunitiesForm = require('./reaching-communities/form-model');

function initFormRouter(formModel) {
    const router = express.Router();

    router.use((req, res, next) => {
        res.locals.isBilingual = false;
        next();
    });

    const routerWithForm = createFormRouter({ router, formModel });

    return routerWithForm;
}

module.exports = ({ router }) => {
    router.get('/', (req, res) => {
        res.redirect('/');
    });

    router.use('/your-idea', initFormRouter(reachingCommunitiesForm));

    return router;
};
