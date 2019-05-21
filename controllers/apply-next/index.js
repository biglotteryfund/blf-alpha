'use strict';
const express = require('express');

const appData = require('../../modules/appData');

const router = express.Router();

if (appData.isNotProduction) {
    router.use('/simple', require('./simple'));
}

module.exports = router;
