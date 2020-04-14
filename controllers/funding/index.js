'use strict';
const path = require('path');
const express = require('express');

const { injectHeroImage } = require('../../common/inject-content');

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
 * Publications router
 */
router.use('/publications', require('./publications'));

/**
 * Past grants router
 */
router.use('/grants', require('./grants'));

module.exports = router;
