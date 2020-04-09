'use strict';
const express = require('express');

const { basicContent, flexibleContent } = require('../common');

const router = express.Router();

router.get('/', flexibleContent());
router.use('/our-people', require('./our-people'));
router.use('/*', basicContent());

module.exports = router;
