'use strict';
const express = require('express');

const { isNotProduction } = require('../../common/appData');

const router = express.Router();

router.get('/', (req, res) => res.redirect('/'));

router.use('/your-idea', require('./reaching-communities'));
router.use('/awards-for-all', require('./awards-for-all'));

if (isNotProduction) {
    router.use('/get-advice', require('./get-advice'));
}

router.get('/emails/unsubscribe', require('./unsubscribe'));
router.post('/handle-expiry', require('./expiry'));

module.exports = router;
