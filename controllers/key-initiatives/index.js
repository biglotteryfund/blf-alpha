'use strict';
const express = require('express');
const path = require('path');
const {
    injectHeroImage
} = require('../../common/inject-content');

const { flexibleContentPage } = require('../common');

const router = express.Router();

router.get('/*');

router.get('/', injectHeroImage('funding-letterbox-new'), function(req, res) {
    res.render(path.resolve(__dirname, './landing'), {
        title: req.i18n.__('toplevel.keyInitiatives.title')
    });
});

router.use('/*', flexibleContentPage());

module.exports = router;
