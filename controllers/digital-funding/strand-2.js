'use strict';
const path = require('path');
const express = require('express');
const { concat } = require('lodash');

const router = express.Router();

router.get('/', (req, res) => {
    res.render(path.resolve(__dirname, './views/strand-2'), {
        title: res.locals.copy.strand2.title,
        breadcrumbs: concat(res.locals.breadcrumbs, [{ label: res.locals.copy.strand2.shortTitle }])
    });
});

router.get('/eligibility', (req, res) => {
    const title = res.locals.copy.strand2.eligibilityDetail.title;
    res.render(path.resolve(__dirname, './views/strand-2-eligibility'), {
        title: title,
        breadcrumbs: concat(res.locals.breadcrumbs, [
            { label: res.locals.copy.strand2.shortTitle, url: './' },
            { label: title }
        ])
    });
});

router.get('/eligibility/ineligible', (req, res) => {
    const title = res.locals.copy.strand2.ineligible.title;
    res.render(path.resolve(__dirname, './views/strand-2-ineligible'), {
        title: title,
        breadcrumbs: concat(res.locals.breadcrumbs, [
            { label: res.locals.copy.strand2.shortTitle, url: './' },
            { label: title }
        ])
    });
});

module.exports = router;
