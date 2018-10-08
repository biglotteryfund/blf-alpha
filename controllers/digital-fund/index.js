'use strict';
const express = require('express');
const path = require('path');
const { concat } = require('lodash');
const { injectCopy, injectHeroImage } = require('../../middleware/inject-content');
const appData = require('../../modules/appData');

const router = express.Router();

router.use(injectHeroImage('digital-buddies-2'), injectCopy('funding.digitalFund'));

router.use((req, res, next) => {
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

// @TODO: Find out if this is temporarily or permanently disabled?
if (appData.isNotProduction) {
    router.use('/assistance', require('./assistance'));
}

module.exports = router;
