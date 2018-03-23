const express = require('express');
const createFormRouter = require('./forms/create-form-router');
const formModel = require('./forms/reaching-communities-form');

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

module.exports = routerWithForm;
