'use strict';
const path = require('path');
const express = require('express');

const { injectCopy, injectHeroImage } = require('../../common/inject-content');

const router = express.Router();

router.use(
    injectHeroImage('digital-buddies-letterbox-new'),
    injectCopy('funding.digitalFund')
);

router.use((req, res, next) => {
    res.locals.breadcrumbs = res.locals.breadcrumbs.concat({
        label: res.locals.title,
        url: req.baseUrl
    });
    next();
});

router.get('/', (req, res) => {
    res.render(path.resolve(__dirname, './views/landing'));
});

router.get('/eligibility', (req, res) => {
    const title = res.locals.copy.fullEligiblity.title;
    res.render(path.resolve(__dirname, './views/full-eligibility'), {
        title: title,
        breadcrumbs: res.locals.breadcrumbs.concat({ label: title })
    });
});

router.get('/strand-1', function(req, res) {
    res.render(path.resolve(__dirname, './views/strand'), {
        title: res.locals.copy.strand1.title,
        currentStrand: 'strand1',
        breadcrumbs: res.locals.breadcrumbs.concat({
            label: res.locals.copy.strand1.shortTitle
        })
    });
});

router.get('/strand-2', function(req, res) {
    res.render(path.resolve(__dirname, './views/strand'), {
        title: res.locals.copy.strand2.title,
        currentStrand: 'strand2',
        breadcrumbs: res.locals.breadcrumbs.concat({
            label: res.locals.copy.strand2.shortTitle
        })
    });
});

router.use('/assistance', require('./assistance'));

module.exports = router;
