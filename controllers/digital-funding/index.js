'use strict';
const express = require('express');
const path = require('path');
const { concat } = require('lodash');
const { injectCopy, injectHeroImage } = require('../../middleware/inject-content');

const router = express.Router();

router.use(injectHeroImage('digital-buddies-2'), injectCopy('funding.digitalFunding'), (req, res, next) => {
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
    const title = 'Full eligibility criteria';
    res.render(path.resolve(__dirname, './views/full-eligibility'), {
        title: title,
        breadcrumbs: concat(res.locals.breadcrumbs, [{ label: title }])
    });
});

router.use('/assistance', require('./assistance'));
router.use('/strand-1', require('./strand-1'));
router.use('/strand-2', require('./strand-2'));

module.exports = router;
