'use strict';
const path = require('path');
const express = require('express');

const { injectCopy, injectHeroImage } = require('../../common/inject-content');
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
        try {
            const fundingProgrammes = await contentApi.getRecentFundingProgrammes(
                req.i18n.getLocale()
            );

            latestProgrammes = fundingProgrammes.result
                ? fundingProgrammes.result
                : [];
        } catch (error) {} // eslint-disable-line no-empty

        res.render(path.resolve(__dirname, './views/funding-landing'), {
            latestProgrammes
        });
    }
);

module.exports = router;
