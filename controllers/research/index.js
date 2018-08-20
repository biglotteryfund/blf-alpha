'use strict';
const { concat, get } = require('lodash');
const path = require('path');

const { heroImages } = require('../../modules/images');
const { isBilingual } = require('../../modules/pageLogic');
const { injectBreadcrumbs, injectResearch, injectResearchEntry } = require('../../middleware/inject-content');

module.exports = ({ router }) => {
    router.get('/', injectResearch, (req, res) => {
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

    router.get('/:slug', injectResearchEntry, injectBreadcrumbs, (req, res, next) => {
        const { researchEntry } = res.locals;

        if (researchEntry) {
            res.render(path.resolve(__dirname, './views/research-detail'), {
                entry: researchEntry,
                heroImage: researchEntry.hero || heroImages.fallbackHeroImage,
                isBilingual: isBilingual(researchEntry.availableLanguages)
            });
        } else {
            next();
        }
    });

    return router;
};
