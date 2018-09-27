'use strict';
const path = require('path');
const express = require('express');
const { concat } = require('lodash');
const router = express.Router();

router.get('/', (req, res) => {
    res.render(path.resolve(__dirname, './views/strand-1'), {
        title: res.locals.copy.strand1.title,
        breadcrumbs: concat(res.locals.breadcrumbs, [{ label: res.locals.copy.strand1.title }])
    });
});

router.get('/eligibility', (req, res) => {
    const title = res.locals.copy.strand1.eligibilityDetail.title;
    res.render(path.resolve(__dirname, './views/strand-1-eligibility'), {
        title: title,
        breadcrumbs: concat(res.locals.breadcrumbs, [
            { label: res.locals.copy.strand1.title, url: './' },
            { label: title }
        ])
    });
});

router.get('/eligibility/ineligible', (req, res) => {
    const title = 'Sorry, you’re ineligible';
    res.render(path.resolve(__dirname, './views/strand-1-ineligible'), {
        title: title,
        breadcrumbs: concat(res.locals.breadcrumbs, [
            { label: res.locals.copy.strand1.title, url: './' },
            { label: 'Ineligible' }
        ])
    });
});

module.exports = router;
