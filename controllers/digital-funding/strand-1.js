'use strict';
const path = require('path');
const express = require('express');
const { concat } = require('lodash');
const router = express.Router();

router.use((req, res, next) => {
    res.locals.pageAccent = 'blue';
    next();
});

router.get('/', (req, res) => {
    res.render(path.resolve(__dirname, './views/strand-1'), {
        title: res.locals.copy.strand1.title,
        breadcrumbs: concat(res.locals.breadcrumbs, [{ label: res.locals.copy.strand1.shortTitle }])
    });
});

router.get('/eligibility', (req, res) => {
    const title = res.locals.copy.strand1.eligibilityDetail.title;
    res.render(path.resolve(__dirname, './views/strand-1-eligibility'), {
        title: title,
        breadcrumbs: concat(res.locals.breadcrumbs, [
            { label: res.locals.copy.strand1.shortTitle, url: './' },
            { label: title }
        ])
    });
});

router.get('/eligibility/ineligible', (req, res) => {
    const title = res.locals.copy.ineligible.title;
    res.render(path.resolve(__dirname, './views/ineligible'), {
        title: title,
        bodyCopy: res.locals.copy.ineligible.strand1,
        breadcrumbs: concat(res.locals.breadcrumbs, [
            { label: res.locals.copy.strand1.shortTitle, url: './' },
            { label: title }
        ])
    });
});

module.exports = router;
