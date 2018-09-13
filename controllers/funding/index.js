'use strict';
const path = require('path');
const express = require('express');
const { find, get } = require('lodash');

const { injectCopy, injectFundingProgrammes } = require('../../middleware/inject-content');

const router = express.Router();

router.get('/', injectCopy('toplevel.funding'), injectFundingProgrammes, (req, res) => {
    const { copy, fundingProgrammes } = res.locals;

    /**
     * "Latest" programmes
     * Hardcoded for now but we may want to fetch these dynamically.
     */
    function getLatestProgrammes(programmes) {
        if (programmes) {
            const findBySlug = slug => find(programmes, p => p.urlPath === `funding/programmes/${slug}`);
            const programmeSlugs = get(copy, 'recentProgrammes', []);
            return programmeSlugs.map(findBySlug);
        } else {
            return [];
        }
    }

    res.render(path.resolve(__dirname, './views/funding-landing'), {
        latestProgrammes: getLatestProgrammes(fundingProgrammes)
    });
});

module.exports = router;
