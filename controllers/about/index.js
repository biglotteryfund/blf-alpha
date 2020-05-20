'use strict';
const express = require('express');

const { basicContent, flexibleContentPage } = require('../common');
const { isNotProduction } = require('../../common/appData');

const router = express.Router();

router.get('/', flexibleContentPage());

router.use('/our-people', require('./our-people'));

if (isNotProduction) {
    router.use('/newsletter', require('../newsletter'));
}

router.use('/*', basicContent());

module.exports = router;
