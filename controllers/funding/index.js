'use strict';
const path = require('path');
const express = require('express');

const { injectHeroImage } = require('../../common/inject-content');
const { basicContent } = require('../common');

const router = express.Router();

/**
 * Landing page
 */
router.get('/', injectHeroImage('funding-letterbox-new'), async (req, res) => {
    res.render(path.resolve(__dirname, './landing'), {
        title: req.i18n.__('toplevel.funding.title'),
    });
});

/**
 * Programmes router
 * - Programme listings
 * - Programme detail pages
 * - Archived programmes
 */
router.use('/programmes', require('./programmes'));

router.use('/strategic-investments', require('./strategic-investments'));

router.use('/publications', require('./publications'));

router.use('/grants', require('./grants'));

// @TODO: Can this page be migrated to Funding structure in the CMS?
router.use('/the-big-lunch', basicContent());

// @TODO: Can this section be migrated to Funding structure in the CMS?
router.use('/funding-guidance/*', basicContent());

/**
 * Custom override: Free materials
 * Allows us to customise the free materials page with an order form,
 * whilst keeping introductory content in the CMS
 */
router.use(
    '/managing-your-grant/promoting-your-project/order-free-materials',
    require('./materials')
);

/**
 * Custom override: Logos
 * Allows us to customise the logos page with a download UI,
 * whilst keeping introductory content in the CMS
 */
router.use(
    '/managing-your-grant/promoting-your-project/download-our-logo',
    basicContent({
        lang: 'funding.guidance.logos',
        customTemplate: 'static-pages/logos',
    })
);

/**
 * Wildcard handler
 * Remaining pages powered by Funding structure in the CMS
 */
router.use(
    '/*',
    basicContent({
        cmsPage: true,
    })
);

module.exports = router;
