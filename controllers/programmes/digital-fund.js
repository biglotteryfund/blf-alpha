'use strict';
const express = require('express');
const path = require('path');
const { concat } = require('lodash');

const router = express.Router();

router.use((req, res, next) => {
    res.locals.isBilingual = false;
    res.locals.heroImage = res.locals.fallbackHeroImage;
    const routerCrumb = {
        label: 'Digital Funding',
        url: req.baseUrl
    };
    res.locals.breadcrumbs = concat(res.locals.breadcrumbs, [routerCrumb]);
    next();
});

router.get('/', (req, res) => {
    res.render(path.resolve(__dirname, './views/digital-fund-landing'), {
        title: 'Digital Funding'
    });
});

router.get('/alternative-funding', (req, res) => {
    const title = 'Alternative funding';
    res.render(path.resolve(__dirname, './views/digital-fund-alternative-funding'), {
        title: title,
        breadcrumbs: concat(res.locals.breadcrumbs, [{ label: title }])
    });
});

router.get('/strand-1', (req, res) => {
    const title = 'Digital Funding: Strand 1';
    res.render(path.resolve(__dirname, './views/digital-fund-strand-1'), {
        title: title,
        breadcrumbs: concat(res.locals.breadcrumbs, [{ label: 'Strand 1' }])
    });
});

router.get('/strand-1/eligibility', (req, res) => {
    const title = 'Request a call';
    res.render(path.resolve(__dirname, './views/digital-fund-strand-1-eligibility'), {
        title: title,
        breadcrumbs: concat(res.locals.breadcrumbs, [{ label: 'Strand 1', url: './' }, { label: 'Request a call' }])
    });
});

router.get('/strand-1/eligibility/no', (req, res) => {
    const title = 'Digital Funding: Strand 1 Eligibility';
    res.render(path.resolve(__dirname, './views/digital-fund-strand-1-no'), {
        title: title,
        breadcrumbs: concat(res.locals.breadcrumbs, [{ label: 'Strand 1', url: './' }, { label: title }])
    });
});

router.get('/strand-2', (req, res) => {
    res.render(path.resolve(__dirname, './views/digital-fund-strand-2'), {
        title: 'Digital Funding: Strand 2',
        heroImage: res.locals.heroImage,
        breadcrumbs: concat(res.locals.breadcrumbs, [{ label: 'Strand 2' }])
    });
});

router.get('/strand-2/eligibility', (req, res) => {
    res.render(path.resolve(__dirname, './views/digital-fund-strand-2-eligibility'), {
        title: 'Digital Funding: Strand 2 Eligibility',
        breadcrumbs: concat(res.locals.breadcrumbs, [{ label: 'Strand 2', url: './' }, { label: 'Eligibility' }])
    });
});

router.get('/strand-2/eligibility/no', (req, res) => {
    res.render(path.resolve(__dirname, './views/digital-fund-strand-2-no'), {
        title: 'Digital Funding: Strand 2 Eligibility',
        breadcrumbs: concat(res.locals.breadcrumbs, [{ label: 'Strand 2', url: './' }, { label: 'Eligibility' }])
    });
});

module.exports = router;
