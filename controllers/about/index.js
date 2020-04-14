'use strict';
const express = require('express');

const { basicContent, flexibleContent } = require('../common');

const router = express.Router();

router.get('/', flexibleContent());
// @TODO: Can we move the our people section to About structure? Add "profile" type to flexible content
router.use('/our-people', require('./our-people'));
router.use('/*', basicContent());

module.exports = router;
