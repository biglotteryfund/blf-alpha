'use strict';
const express = require('express');

const { flexibleContentPage } = require('../common');

const router = express.Router();

router.get('/', flexibleContentPage());

// Show the Siblings sidebar for Our People section
router.get('/our-people/*', (req, res, next) => {
    res.locals.showSiblings = true;
    next();
});

router.use('/newsletter', require('../newsletter'));

router.use('/*', flexibleContentPage());

module.exports = router;
