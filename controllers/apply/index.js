'use strict';
const express = require('express');
const router = express.Router();

router.use('/example', require('./example'));
router.use('/your-idea', require('./reaching-communities'));

module.exports = router;
