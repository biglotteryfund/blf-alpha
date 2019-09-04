'use strict';
const path = require('path');
const express = require('express');

const {
    injectCopy,
    injectHeroImage
} = require('../../middleware/inject-content');
const { sMaxAge } = require('../../common/cached');
const contentApi = require('../../common/content-api');

const router = express.Router();

router.get(
    '/',
    sMaxAge(1800),
    injectCopy('toplevel.funding'),
    injectHeroImage('funding-letterbox-new'),
    async (req, res) => {
        let latestProgrammes = [];
        let bigLunch = false;
        try {
            const fundingProgrammes = await contentApi.getRecentFundingProgrammes(
                {
                    locale: req.i18n.getLocale(),
                    limit: 2
                }
            );

            const bigLunchContent = await contentApi.getListingPage({
                locale: req.i18n.getLocale(),
                path: 'funding/the-big-lunch'
            });

            bigLunch = bigLunchContent;
            latestProgrammes = fundingProgrammes.result
                ? fundingProgrammes.result
                : null;
        } catch (error) {} // eslint-disable-line no-empty

        res.render(path.resolve(__dirname, './views/funding-landing'), {
            latestProgrammes,
            bigLunch
        });
    }
);

module.exports = router;
