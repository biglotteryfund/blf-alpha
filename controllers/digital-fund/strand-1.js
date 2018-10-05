'use strict';
const path = require('path');
const express = require('express');
const { concat } = require('lodash');

const { localify } = require('../../modules/urls');

const router = express.Router();

router.use((req, res, next) => {
    res.locals.pageAccent = 'blue';
    next();
});

router.get('/', (req, res) => {
    res.render(path.resolve(__dirname, './views/strand'), {
        title: res.locals.copy.strand1.title,
        currentStrand: 'strand1',
        eligibilityLink: localify(req.i18n.getLocale())('/funding/programmes/digital-fund/strand-1/eligibility'),
        breadcrumbs: concat(res.locals.breadcrumbs, [{ label: res.locals.copy.strand1.shortTitle }])
    });
});

router.get('/eligibility', (req, res) => {
    const { copy } = res.locals;
    const title = copy.eligibilityChecker.title;
    res.render(path.resolve(__dirname, './views/eligibility-checker'), {
        title: title,
        strandCopy: copy.eligibilityChecker.strand1,
        yesUrl: localify(req.i18n.getLocale())('/apply/digital-fund-strand-1/1'),
        noUrl: req.baseUrl + '/eligibility/ineligible',
        breadcrumbs: concat(res.locals.breadcrumbs, [
            { label: res.locals.copy.strand1.shortTitle, url: './' },
            { label: title }
        ])
    });
});

router.get('/eligibility/ineligible', (req, res) => {
    const title = res.locals.copy.eligibilityChecker.ineligibleTitle;
    res.render(path.resolve(__dirname, './views/ineligible'), {
        title: title,
        strandCopy: res.locals.copy.eligibilityChecker.strand1,
        breadcrumbs: concat(res.locals.breadcrumbs, [
            { label: res.locals.copy.strand1.shortTitle, url: './' },
            { label: title }
        ])
    });
});

module.exports = router;
