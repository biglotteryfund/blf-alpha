'use strict';
const path = require('path');
const express = require('express');

const { injectHeroImage } = require('../../common/inject-content');
const contentApi = require('../../common/content-api');

const router = express.Router();

router.get('/', injectHeroImage('funding-letterbox-new'), async (req, res) => {
    /**
     * Fetch latest funding programmes, but consider them optional,
     * we can still render the page without them.
     */
    let latestProgrammes = [];
    try {
        latestProgrammes = await contentApi.getRecentFundingProgrammes(
            req.i18n.getLocale()
        );
    } catch (error) {} // eslint-disable-line no-empty

    res.render(path.resolve(__dirname, './views/funding-landing'), {
        title: req.i18n.__('toplevel.funding.title'),
        latestProgrammes: latestProgrammes
    });
});

module.exports = router;
