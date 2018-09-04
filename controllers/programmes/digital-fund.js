'use strict';
const express = require('express');
const path = require('path');
const { flatten } = require('lodash');
const { injectHeroImage } = require('../../middleware/inject-content');

const router = express.Router();

/**
 * Create a mock breadcrumb trail
 * @param {express.Request} req
 * @param {Array<object>} extraCrumbs
 */
function mockBreadcrumbs(req, extraCrumbs = []) {
    const section = { label: 'Funding', url: '#' };
    const programmes = { label: 'Programmes', url: '#' };
    const fund = { label: 'Digital Fund' };

    if (extraCrumbs.length > 0) {
        fund.url = req.baseUrl;
        return flatten([section, programmes, fund, extraCrumbs]);
    } else {
        return [section, programmes, fund];
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
        breadcrumbs: mockBreadcrumbs(req, [
            {
                label: 'Getting started'
            }
        ])
    });
});

router.get('/strand-1', (req, res) => {
    res.render(path.resolve(__dirname, './views/digital-fund-strand-1'), {
        title: 'Digital Funding: Strand 1',
        heroImage: res.locals.heroImage,
        breadcrumbs: mockBreadcrumbs(req, [
            {
                label: 'Strand 1'
            }
        ])
    });
});

router.get('/strand-1/eligibility', (req, res) => {
    res.render(path.resolve(__dirname, './views/digital-fund-strand-1-eligibility'), {
        title: 'Digital Funding: Strand 1 Eligibility',
        heroImage: res.locals.heroImage,
        breadcrumbs: mockBreadcrumbs(req, [
            {
                label: 'Strand 1',
                url: './'
            },
            {
                label: 'Eligibility'
            }
        ])
    });
});

router.get('/strand-1/eligibility/no', (req, res) => {
    res.render(path.resolve(__dirname, './views/digital-fund-strand-1-no'), {
        title: 'Digital Funding: Strand 1 Eligibility',
        heroImage: res.locals.heroImage,
        breadcrumbs: mockBreadcrumbs(req, [
            {
                label: 'Strand 1',
                url: '../'
            },
            {
                label: 'Eligibility'
            }
        ])
    });
});

router.get('/strand-2', (req, res) => {
    res.render(path.resolve(__dirname, './views/digital-fund-strand-2'), {
        title: 'Digital Funding: Strand 2',
        heroImage: res.locals.heroImage,
        breadcrumbs: mockBreadcrumbs(req, [
            {
                label: 'Strand 2'
            }
        ])
    });
});

router.get('/strand-2/eligibility', (req, res) => {
    res.render(path.resolve(__dirname, './views/digital-fund-strand-2-eligibility'), {
        title: 'Digital Funding: Strand 2 Eligibility',
        heroImage: res.locals.heroImage,
        breadcrumbs: mockBreadcrumbs(req, [
            {
                label: 'Strand 2',
                url: './'
            },
            {
                label: 'Eligibility'
            }
        ])
    });
});

router.get('/strand-2/eligibility/no', (req, res) => {
    res.render(path.resolve(__dirname, './views/digital-fund-strand-2-no'), {
        title: 'Digital Funding: Strand 2 Eligibility',
        heroImage: res.locals.heroImage,
        breadcrumbs: mockBreadcrumbs(req, [
            {
                label: 'Strand 2',
                url: '../'
            },
            {
                label: 'Eligibility'
            }
        ])
    });
});

module.exports = router;
