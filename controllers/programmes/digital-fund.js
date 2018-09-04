'use strict';
const express = require('express');
const path = require('path');
const { injectHeroImage } = require('../../middleware/inject-content');

const router = express.Router();

function mockBreadcrumbs(req, currentTitle) {
    const firstCrumb = { label: 'Funding', url: '/funding' };
    const secondCrumb = { label: 'Programmes', url: '/funding/programmes' };
    const thirdCrumb = { label: 'Digital Fund' };

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
        title: 'Digital Funding'
    });
});

router.get('/getting-started', (req, res) => {
    res.render(path.resolve(__dirname, './views/digital-fund-getting-started'), {
        heroImage: res.locals.heroImage,
        title: 'Getting started'
    });
});

router.get('/strand-1', (req, res) => {
    res.render(path.resolve(__dirname, './views/digital-fund-strand-1'), {
        title: 'Digital Fund: Strand 1',
        heroImage: res.locals.heroImage,
        breadcrumbs: mockBreadcrumbs(req, 'Strand 1')
    });
});

router.get('/strand-2', (req, res) => {
    res.render(path.resolve(__dirname, './views/digital-fund-strand-2'), {
        title: 'Digital Fund: Strand 2',
        heroImage: res.locals.heroImage,
        breadcrumbs: mockBreadcrumbs(req, 'Strand 2')
    });
});

module.exports = router;
