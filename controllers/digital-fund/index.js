'use strict';
const express = require('express');
const path = require('path');
const { concat } = require('lodash');
const config = require('config');
const { injectCopy, injectHeroImage } = require('../../middleware/inject-content');

const router = express.Router();

router.use(injectHeroImage('digital-buddies-letterbox-new'), injectCopy('funding.digitalFund'));

router.use((req, res, next) => {
    res.locals.enableDigitalFundApplications = config.get('features.enableDigitalFundApplications');
    res.locals.breadcrumbs = concat(res.locals.breadcrumbs, [
        {
            label: res.locals.title,
            url: req.baseUrl
        }
    ]);
    next();
});

router.get('/', (req, res) => {
    res.render(path.resolve(__dirname, './views/landing'));
});

router.get('/eligibility', (req, res) => {
    const title = res.locals.copy.fullEligiblity.title;
    res.render(path.resolve(__dirname, './views/full-eligibility'), {
        title: title,
        breadcrumbs: concat(res.locals.breadcrumbs, [{ label: title }])
    });
});

router.use('/strand-1', require('./strand-1'));
router.use('/strand-2', require('./strand-2'));
router.use('/assistance', require('./assistance'));

module.exports = router;
