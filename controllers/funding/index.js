'use strict';
const path = require('path');
const express = require('express');

const { injectHeroImage } = require('../../middleware/inject-content');
const { sMaxAge } = require('../../middleware/cached');
const contentApi = require('../../services/content-api');

const router = express.Router();

router.get('/', sMaxAge('30m'), injectHeroImage('funding-letterbox-new'), async (req, res) => {
    let latestProgrammes = [];
    let bigLunch = false;
    try {
        const fundingProgrammes = await contentApi.getRecentFundingProgrammes({
            locale: req.i18n.getLocale(),
            limit: 2
        });

        const bigLunchContent = await contentApi.getListingPage({
            locale: req.i18n.getLocale(),
            path: 'funding/the-big-lunch'
        });

        bigLunch = bigLunchContent;
        latestProgrammes = fundingProgrammes.result ? fundingProgrammes.result : null;
    } catch (error) {} // eslint-disable-line no-empty

    res.render(path.resolve(__dirname, './views/funding-landing'), { latestProgrammes, bigLunch });
});

module.exports = router;
