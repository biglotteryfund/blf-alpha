'use strict';
const path = require('path');
const express = require('express');

const { injectHeroImage } = require('../../common/inject-content');

const router = express.Router();

router.get('/', injectHeroImage('funding-letterbox-new'), async (req, res) => {
    res.render(path.resolve(__dirname, './views/funding-landing'), {
        title: req.i18n.__('toplevel.funding.title'),
    });
});

module.exports = router;
