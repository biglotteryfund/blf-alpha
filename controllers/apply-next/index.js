'use strict';
const express = require('express');

const { initFormRouter } = require('./form-router');
const appData = require('../../modules/appData');

const { formModel } = require('./simple/form-model');

const router = express.Router();

if (appData.isNotProduction) {
    router.get('/', (req, res) => res.redirect('/'));
    router.use('/simple', initFormRouter('awards-for-all', formModel));
}

module.exports = router;
