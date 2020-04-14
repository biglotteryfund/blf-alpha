'use strict';
const path = require('path');
const express = require('express');

const { injectHeroImage } = require('../../common/inject-content');
const { basicContent } = require('../common');

const router = express.Router();

/**
 * Landing page
 */
router.get('/', injectHeroImage('funding-letterbox-new'), async function (
    req,
    res
) {
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

/**
 * Strategic investments router
 */
router.use('/strategic-investments', require('./strategic-investments'));

/**
 * Publications router
 */
router.use('/publications', require('./publications'));

/**
 * Past grants router
 */
router.use('/grants', require('./grants'));

// @TODO: Can this page be migrated to Funding structure in the CMS?
router.use('/the-big-lunch', basicContent());

// @TODO: Can this section be migrated to Funding structure in the CMS?
router.use('/funding-guidance/*', basicContent());

module.exports = router;
