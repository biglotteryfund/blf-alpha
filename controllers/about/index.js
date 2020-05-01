'use strict';
const express = require('express');

const { basicContent, flexibleContentPage } = require('../common');
const { isNotProduction } = require('../../common/appData');

const router = express.Router();

router.get('/', flexibleContentPage());

// @TODO: Can we move the our people section to About structure? Add "profile" type to flexible content
router.use('/our-people', require('./our-people'));

if (isNotProduction) {
    router.use('/ebulletin', require('../ebulletin'));
}

router.use('/*', basicContent());

module.exports = router;
