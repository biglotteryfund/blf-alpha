'use strict';
const express = require('express');

const { createFormRouter } = require('../helpers/create-form-router');
const formModel = require('./reaching-communities-form');

function initYourIdea() {
    const router = express.Router();

    router.use((req, res, next) => {
        res.locals.isBilingual = false;
        next();
    });

    const routerWithForm = createFormRouter({ router, formModel });

    return routerWithForm;
}

module.exports = () => {
    const router = express.Router();

    router.get('/', (req, res) => {
        res.redirect('/');
    });

    router.use('/your-idea', initYourIdea());

    return router;
};
