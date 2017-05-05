'use strict';
const express = require('express');
const router = express.Router();

const PATHS = {
    manageFunding: '/funding-guidance/managing-your-funding',
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

module.exports = router;
