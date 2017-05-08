'use strict';
const express = require('express');
const router = express.Router();
const materials = require('../config/content/materials.json');

const PATHS = {
    manageFunding: '/funding-guidance/managing-your-funding',
    freeMaterials: '/funding-guidance/managing-your-funding/ordering-free-materials',
    logoIndex:     '/funding-guidance/managing-your-funding/grant-acknowledgement-and-logos',
    logoDownloads: '/funding-guidance/managing-your-funding/grant-acknowledgement-and-logos/logodownloads'
};

// redirect logoIndex => logoDownloads
router.get(PATHS.logoIndex, (req, res, next) => {
    res.redirect(req.baseUrl + PATHS.logoDownloads);
});

// logo download page
router.get(PATHS.logoDownloads, (req, res, next) => {
    res.render('pages/funding/guidance/logos', {
        title: "Logos"
    });
});

// funding management page
router.get(PATHS.manageFunding, (req, res, next) => {
    res.render('pages/funding/guidance/managing-your-funding', {
        title: "Managing your funding"
    });
});

// ordering free materials page
router.get(PATHS.freeMaterials, (req, res, next) => {
    res.render('pages/funding/guidance/order-free-materials', {
        title: req.i18n.__("funding.guidance.order-free-materials.title"),
        materials: materials.categories
    });
});

module.exports = router;
