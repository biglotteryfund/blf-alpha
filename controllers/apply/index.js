'use strict';
const express = require('express');
const createFormRouter = require('./forms/create-form-router');
const formModel = require('./reaching-communities-form');

function initYourIdea() {
    const router = express.Router();

    router.use((req, res, next) => {
        res.locals.isBilingual = false;
        next();
    });

    router.get('/', (req, res) => {
        res.render('pages/apply/reaching-communities-startpage', {
            startUrl: `${req.baseUrl}/1`,
            form: formModel
        });
    });

    const routerWithForm = createFormRouter(router, formModel);

    return routerWithForm;
}

module.exports = () => {
    const router = express.Router();

    router.use('/your-idea', initYourIdea());

    return router;
};
