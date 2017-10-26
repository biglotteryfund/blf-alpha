const express = require('express');
const createFormRouter = require('./forms/create-form-router');
const formModel = require('./forms/example-form');

const router = express.Router();

router.get('/', (req, res) => {
    res.render('pages/experimental/apply/example-startpage', {
        startUrl: `${req.baseUrl}/1`
    });
});

const routerWithForm = createFormRouter(router, formModel);

module.exports = routerWithForm;
