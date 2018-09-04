'use strict';
const express = require('express');
const path = require('path');
const { injectHeroImage } = require('../../middleware/inject-content');

const router = express.Router();

function mockBreadcrumbs(req, currentTitle) {
    const firstCrumb = { label: 'Funding', url: '/funding' };
    const secondCrumb = { label: 'Programmes', url: '/funding/programmes' };
    const thirdCrumb = { label: 'Digital Funding' };

    if (currentTitle) {
        thirdCrumb.url = req.baseUrl;
        const currentCrumb = { label: currentTitle };
        return [firstCrumb, secondCrumb, thirdCrumb, currentCrumb];
    } else {
        return [firstCrumb, secondCrumb, thirdCrumb];
    }
}

router.use(injectHeroImage('whizz-kidz'));

router.get('/', (req, res) => {
    res.render(path.resolve(__dirname, './views/digital-fund-landing'), {
        heroImage: res.locals.heroImage,
        title: 'Digital Funding',
        breadcrumbs: mockBreadcrumbs(req)
    });
});

router.get('/getting-started', (req, res) => {
    res.render(path.resolve(__dirname, './views/digital-fund-getting-started'), {
        heroImage: res.locals.heroImage,
        title: 'Getting started',
        breadcrumbs: mockBreadcrumbs(req, 'Getting Started')
    });
});

router.get('/strand-1', (req, res) => {
    res.render(path.resolve(__dirname, './views/digital-fund-strand-1'), {
        title: 'Digital Funding: Strand 1',
        heroImage: res.locals.heroImage,
        breadcrumbs: mockBreadcrumbs(req, 'Strand 1')
    });
});

router.get('/strand-1/eligibility', (req, res) => {
    res.render(path.resolve(__dirname, './views/digital-fund-strand-1-eligibility'), {
        title: 'Digital Funding: Strand 1 Eligibility',
        heroImage: res.locals.heroImage,
        breadcrumbs: mockBreadcrumbs(req, 'Strand 1 Eligibility')
    });
});

router.get('/strand-1/eligibility/no', (req, res) => {
    res.render(path.resolve(__dirname, './views/digital-fund-strand-1-no'), {
        title: 'Digital Funding: Strand 1 Eligibility',
        heroImage: res.locals.heroImage,
        breadcrumbs: mockBreadcrumbs(req, 'Strand 1 Eligibility')
    });
});

router.get('/strand-2', (req, res) => {
    res.render(path.resolve(__dirname, './views/digital-fund-strand-2'), {
        title: 'Digital Funding: Strand 2',
        heroImage: res.locals.heroImage,
        breadcrumbs: mockBreadcrumbs(req, 'Strand 2')
    });
});

router.get('/strand-2/eligibility', (req, res) => {
    res.render(path.resolve(__dirname, './views/digital-fund-strand-2-eligibility'), {
        title: 'Digital Funding: Strand 2 Eligibility',
        heroImage: res.locals.heroImage,
        breadcrumbs: mockBreadcrumbs(req, 'Strand 2 Eligibility')
    });
});

router.get('/strand-2/eligibility/no', (req, res) => {
    res.render(path.resolve(__dirname, './views/digital-fund-strand-2-no'), {
        title: 'Digital Funding: Strand 2 Eligibility',
        heroImage: res.locals.heroImage,
        breadcrumbs: mockBreadcrumbs(req, 'Strand 2 Eligibility')
    });
});

module.exports = router;
