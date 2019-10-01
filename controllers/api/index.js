'use strict';
const express = require('express');
const router = express.Router();

/**
 * API: UK address lookup proxy
 */
router.use('/address-lookup', require('./address-lookup'));

/**
 * API: Feedback endpoint
 */
router.use('/feedback', require('./feedback'));

/**
 * API: Survey endpoint
 */
router.use('/survey', require('./survey'));

module.exports = router;
