'use strict';
const path = require('path');
const express = require('express');
const { find, get, shuffle, take } = require('lodash');

const { injectFundingProgrammes, injectHeroImage, injectCopy } = require('../../middleware/inject-content');
const { sMaxAge } = require('../../middleware/cached');
const contentApi = require('../../services/content-api');

const router = express.Router();

router.get('/', sMaxAge('30m'), injectHeroImage('active-plus-communities'), injectFundingProgrammes, (req, res) => {
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

router.get('/past-grants', injectCopy('funding.pastGrants'), injectHeroImage('active-plus-communities'), async (req, res, next) => {

    let caseStudies = await contentApi.getCaseStudies({
        locale: req.i18n.getLocale()
    });

    // Shuffle the valid case studies and grab the first few
    caseStudies = take(shuffle(caseStudies.filter(c => c.grantId)), 3);

    res.render(path.resolve(__dirname, './views/past-grants'), {
        title: 'Search awarded grants: Beta',
        caseStudies: caseStudies
    });
});

module.exports = router;
