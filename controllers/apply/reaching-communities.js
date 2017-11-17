const express = require('express');
const createFormRouter = require('./forms/create-form-router');
const formModel = require('./forms/reaching-communities-form');

const router = express.Router();

router.get('/', (req, res) => {
    res.render('pages/experimental/apply/reaching-communities-startpage', {
        startUrl: `${req.baseUrl}/1`
    });
});

const routerWithForm = createFormRouter(router, formModel);

module.exports = routerWithForm;
