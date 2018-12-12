'use strict';
const path = require('path');
const express = require('express');
const { find, get } = require('lodash');

const { injectFundingProgrammes, injectHeroImage } = require('../../middleware/inject-content');
const { sMaxAge } = require('../../middleware/cached');

const router = express.Router();

router.get('/', sMaxAge('30m'), injectHeroImage('manchester-cares'), injectFundingProgrammes, (req, res) => {
    const { copy, fundingProgrammes } = res.locals;

    /**
     * "Latest" programmes
     * Hardcoded for now but we may want to fetch these dynamically.
     */
    function getLatestProgrammes(programmes) {
        if (programmes) {
            const programmeSlugs = get(copy, 'recentProgrammes', []);
            return programmeSlugs.map(slug => find(programmes, programme => programme.linkUrl.indexOf(slug) !== -1));
        } else {
            return [];
        }
    }

    res.render(path.resolve(__dirname, './views/funding-landing'), {
        latestProgrammes: getLatestProgrammes(fundingProgrammes)
    });
});

module.exports = router;
