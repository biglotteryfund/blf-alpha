'use strict';
const path = require('path');
const express = require('express');
const { concat } = require('lodash');
const router = express.Router();

const { injectCopy } = require('../../middleware/inject-content');

const getStrandTitle = req => req.i18n.__('funding.digitalFunding.strand1.overallTitle');

router.get('/', (req, res) => {
    const strandTitle = getStrandTitle(req);
    res.render(path.resolve(__dirname, './views/strand-1'), {
        title: strandTitle,
        breadcrumbs: concat(res.locals.breadcrumbs, [{ label: strandTitle }])
    });
});

router.get('/eligibility', injectCopy('funding.digitalFunding.strand1.eligibilityDetail'), (req, res) => {
    const title = res.locals.copy.title;
    const strandTitle = getStrandTitle(req);
    res.render(path.resolve(__dirname, './views/strand-1-eligibility'), {
        title: title,
        breadcrumbs: concat(res.locals.breadcrumbs, [{ label: strandTitle, url: './' }, { label: title }])
    });
});

router.get('/eligibility/ineligible', injectCopy('funding.digitalFunding.strand1.ineligible'), (req, res) => {
    const title = res.locals.copy.title;
    const strandTitle = getStrandTitle(req);
    res.render(path.resolve(__dirname, './views/strand-1-ineligible'), {
        title: title,
        breadcrumbs: concat(res.locals.breadcrumbs, [{ label: strandTitle, url: './' }, { label: title }])
    });
});

module.exports = router;
