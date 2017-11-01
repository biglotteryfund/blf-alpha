'use strict';
const express = require('express');
const router = express.Router();

router.use('/example', require('./example'));

module.exports = router;
