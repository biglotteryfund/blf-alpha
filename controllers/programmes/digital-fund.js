'use strict';
const express = require('express');
const path = require('path');
const { concat } = require('lodash');

const router = express.Router();

router.use((req, res, next) => {
    res.locals.isBilingual = false;
    res.locals.heroImage = {
        small: '/assets/images/hero/blank-small.jpg',
        medium: '/assets/images/hero/blank-medium.jpg',
        large: '/assets/images/hero/blank-large.jpg',
        default: '/assets/images/hero/blank-medium.jpg'
    };

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

router.get('/alt', (req, res) => {
    res.render(path.resolve(__dirname, './views/digital-fund-landing-alt'), {
        title: 'Digital Funding'
    });
});

router.get('/alternative-funding', (req, res) => {
    const title = 'Help getting started with digital';
    res.render(path.resolve(__dirname, './views/digital-fund-alternative-funding'), {
        title: title,
        breadcrumbs: concat(res.locals.breadcrumbs, [{ label: title }])
    });
});

router.get('/strand-1', (req, res) => {
    const title = 'Using digital to change your business';
    res.render(path.resolve(__dirname, './views/digital-fund-strand-1'), {
        title: title,
        breadcrumbs: concat(res.locals.breadcrumbs, [{ label: title }])
    });
});

router.get('/strand-1/eligibility', (req, res) => {
    const title = 'Request a call';
    res.render(path.resolve(__dirname, './views/digital-fund-strand-1-eligibility'), {
        title: title,
        breadcrumbs: concat(res.locals.breadcrumbs, [
            { label: 'Using digital to change your business', url: './' },
            { label: title }
        ])
    });
});

router.get('/strand-1/eligibility/no', (req, res) => {
    const title = 'Request a call';
    res.render(path.resolve(__dirname, './views/digital-fund-strand-1-no'), {
        title: title,
        breadcrumbs: concat(res.locals.breadcrumbs, [
            { label: 'Using digital to change your business', url: './' },
            { label: title }
        ])
    });
});

router.get('/strand-2', (req, res) => {
    res.render(path.resolve(__dirname, './views/digital-fund-strand-2'), {
        title: 'Using digital to scale your impact',
        heroImage: res.locals.heroImage,
        breadcrumbs: concat(res.locals.breadcrumbs, [{ label: 'Scale your impact' }])
    });
});

router.get('/strand-2/eligibility', (req, res) => {
    const title = 'Request a call';
    res.render(path.resolve(__dirname, './views/digital-fund-strand-2-eligibility'), {
        title: title,
        breadcrumbs: concat(res.locals.breadcrumbs, [{ label: 'Scale your impact', url: './' }, { label: title }])
    });
});

router.get('/strand-2/eligibility/no', (req, res) => {
    const title = 'Request a call';
    res.render(path.resolve(__dirname, './views/digital-fund-strand-2-no'), {
        title: title,
        breadcrumbs: concat(res.locals.breadcrumbs, [{ label: 'Scale your impact', url: './' }, { label: title }])
    });
});

module.exports = router;
