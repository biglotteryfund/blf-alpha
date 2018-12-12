'use strict';
const { concat, get } = require('lodash');
const express = require('express');
const path = require('path');
const features = require('config').get('features');

const { injectCopy, injectHeroImage, injectResearch } = require('../../middleware/inject-content');

const router = express.Router();

router.get('/', injectHeroImage('hapani'), injectCopy('toplevel.research'), injectResearch, (req, res) => {
    const { copy } = res.locals;
    const researchEntries = get(res.locals, 'researchEntries', []);

    /**
     * Prepend new reports from the CMS to the list of section links
     */
    let links = copy.sectionLinks;
    if (features.enableNewInsightsSection === false && researchEntries.length > 0) {
        links = concat(
            researchEntries.map(entry => {
                return {
                    label: `${copy.newReport}: ${entry.title}`,
                    href: entry.linkUrl
                };
            }),
            links
        );
    }

    res.render(path.resolve(__dirname, './views/research-landing'), {
        links
    });
});

module.exports = router;
