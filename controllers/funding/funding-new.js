'use strict';
const path = require('path');
const express = require('express');
const router = express.Router();

const { injectHeroImage } = require('../../middleware/inject-content');

router.use('/', injectHeroImage('arkwright-meadows'), function(req, res) {
    res.locals.isBilingual = false;
    res.render(path.resolve(__dirname, './views/landing-navigation-test'));
});

module.exports = router;
