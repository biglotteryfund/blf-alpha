'use strict';
const path = require('path');
const express = require('express');
const { find, get } = require('lodash');

const { injectHeroImage } = require('../../middleware/inject-content');
const { sMaxAge } = require('../../middleware/cached');
const contentApi = require('../../services/content-api');

const router = express.Router();

router.get('/', sMaxAge('30m'), injectHeroImage('funding-letterbox-new'), async (req, res) => {
    let latestProgrammes = [];

    /**
     * "Latest" programmes
     * Fetch all programmes and look up slugs based on hard-coded list in copy.
     * Hardcoded for now but we may want to fetch these dynamically.
     */
    try {
        const fundingProgrammes = await contentApi.getFundingProgrammes({
            locale: req.i18n.getLocale(),
            pageLimit: 3,
            newestFirst: true
        });
        latestProgrammes = fundingProgrammes.result ? fundingProgrammes.result : null;
    } catch (error) {} // eslint-disable-line no-empty

    res.render(path.resolve(__dirname, './views/funding-landing'), { latestProgrammes });
});

module.exports = router;
