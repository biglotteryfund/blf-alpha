'use strict';
const path = require('path');
const express = require('express');
const { concat } = require('lodash');

const router = express.Router();
const { injectCopy } = require('../../middleware/inject-content');

const strandTitle = 'Scale your impact';

router.get('/', (req, res) => {
    res.render(path.resolve(__dirname, './views/strand-2'), {
        title: 'Using digital to scale your impact',
        heroImage: res.locals.heroImage,
        breadcrumbs: concat(res.locals.breadcrumbs, [{ label: strandTitle }])
    });
});

router.get('/eligibility', injectCopy('funding.digitalFunding.strand2.eligibilityDetail'), (req, res) => {
    const title = res.locals.copy.title;
    res.render(path.resolve(__dirname, './views/strand-2-eligibility'), {
        title: title,
        breadcrumbs: concat(res.locals.breadcrumbs, [{ label: strandTitle, url: './' }, { label: title }])
    });
});

router.get('/eligibility/ineligible', (req, res) => {
    const title = 'Sorry, you’re ineligible';
router.get('/eligibility/ineligible', injectCopy('funding.digitalFunding.strand2.ineligible'), (req, res) => {
    const title = res.locals.copy.title;
    res.render(path.resolve(__dirname, './views/strand-2-ineligible'), {
        title: title,
        breadcrumbs: concat(res.locals.breadcrumbs, [{ label: strandTitle, url: './' }, { label: 'Ineligible' }])
    });
});

module.exports = router;
