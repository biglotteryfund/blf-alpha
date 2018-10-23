'use strict';
const { concat, get } = require('lodash');
const express = require('express');
const path = require('path');

const {
    injectBreadcrumbs,
    injectCopy,
    injectHeroImage,
    injectResearch,
    injectResearchEntry
} = require('../../middleware/inject-content');
const appData = require('../../modules/appData');

const router = express.Router();

router.get('/', injectHeroImage('hapani'), injectCopy('toplevel.research'), injectResearch, (req, res) => {
    const { copy } = res.locals;
    const researchEntries = get(res.locals, 'researchEntries', []);

    /**
     * Prepend new reports from the CMS to the list of section links
     */
    let links = copy.sectionLinks;
    if (researchEntries.length > 0) {
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

if (appData.isNotProduction) {
    router.get(
        '/landing-new',
        injectHeroImage('hapani'),
        injectCopy('toplevel.researchNew'),
        injectResearch,
        (req, res) => {
            res.render(path.resolve(__dirname, './views/research-landing-new'));
        }
    );
}

router.get('/:slug', injectResearchEntry, injectBreadcrumbs, (req, res, next) => {
    const { researchEntry } = res.locals;
    if (researchEntry) {
        res.render(path.resolve(__dirname, './views/research-detail'), {
            entry: researchEntry,
            heroImage: researchEntry.hero || res.locals.fallbackHeroImage
        });
    } else {
        next();
    }
});

module.exports = router;
