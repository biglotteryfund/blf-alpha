'use strict';
const path = require('path');
const config = require('config');
const express = require('express');
const { concat } = require('lodash');

const { localify } = require('../../modules/urls');

const features = config.get('features');

const router = express.Router();

router.use((req, res, next) => {
    res.locals.pageAccent = 'cyan';
    next();
});

router.get('/', (req, res) => {
    res.render(path.resolve(__dirname, './views/strand'), {
        title: res.locals.copy.strand2.title,
        currentStrand: 'strand2',
        eligibilityLink: localify(req.i18n.getLocale())('/funding/programmes/digital-fund/strand-2/eligibility'),
        breadcrumbs: concat(res.locals.breadcrumbs, [{ label: res.locals.copy.strand2.shortTitle }])
    });
});

if (features.enableDigitalFundApplications) {
    router.get('/eligibility', (req, res) => {
        const { copy } = res.locals;
        const title = copy.eligibilityChecker.title;
        res.render(path.resolve(__dirname, './views/eligibility-checker'), {
            title: title,
            strandCopy: copy.eligibilityChecker.strand2,
            yesUrl: localify(req.i18n.getLocale())('/apply/digital-fund-strand-2/1'),
            noUrl: req.baseUrl + '/eligibility/ineligible',
            breadcrumbs: concat(res.locals.breadcrumbs, [
                { label: res.locals.copy.strand2.shortTitle, url: './' },
                { label: title }
            ])
        });
    });

    router.get('/eligibility/ineligible', (req, res) => {
        const title = res.locals.copy.eligibilityChecker.ineligibleTitle;
        res.render(path.resolve(__dirname, './views/ineligible'), {
            title: title,
            strandCopy: res.locals.copy.eligibilityChecker.strand2,
            breadcrumbs: concat(res.locals.breadcrumbs, [
                { label: res.locals.copy.strand2.shortTitle, url: './' },
                { label: title }
            ])
        });
    });
} else {
    router.get('/eligibility*', (req, res) => res.redirect(req.baseUrl));
}

module.exports = router;
