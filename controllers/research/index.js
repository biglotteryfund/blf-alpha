'use strict';
const { concat, get } = require('lodash');
const path = require('path');

const { isBilingual } = require('../../modules/pageLogic');
const { injectBreadcrumbs, injectResearch, injectResearchEntry } = require('../../middleware/inject-content');
const appData = require('../../modules/appData');

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

    if (appData.isNotProduction) {
        router.get('/landing-new', injectResearch, (req, res) => {
            const { researchEntries } = res.locals;

            /**
             * Mock out additional research entries based on CMS data,
             * allows us to test the page before these pages are published.
             * Delete these mocks once these pages are live.
             */
            const researchEntriesWithMocks = concat(researchEntries, [
                {
                    linkUrl: '/research/youth-employment?draft=47',
                    title: 'Youth employment',
                    trailText:
                        'Learnings related to the design and implementation of services for young people who are considered furthest away from the labour market.',
                    thumbnail:
                        'https://biglotteryfund-assets.imgix.net/media/heroes/samba-ya-bamba-young-start-2-medium.jpg?auto=compress%2Cformat&crop=entropy&fit=crop&h=360&w=640&s=f484306a78326afcecf2603f166c3b59',
                    documents: [
                        {
                            title: 'Full report',
                            url:
                                'https://media.biglotteryfund.org.uk/media/documents/youth-serious-violence-full-report.pdf?mtime=20180816092318',
                            filetype: 'pdf',
                            filesize: '824.72 KB',
                            contents: [
                                'Full briefing',
                                'Introduction',
                                'Talent Match achievements ',
                                'Lessons for policy and programme design',
                                'Sources'
                            ]
                        }
                    ]
                },
                {
                    linkUrl: '/research/place-based-working?draft=48',
                    title: 'Place-based working and funding',
                    trailText: 'Summary of learning about working and funding in place-based ways',
                    thumbnail:
                        'https://biglotteryfund-assets.imgix.net/media/heroes/city-gateway-reaching-communities-medium.jpg?auto=compress%2Cformat&crop=entropy&fit=crop&h=360&w=640&s=651de41cfc0ff05fcdc7e40189cca2ba',
                    documents: [
                        {
                            title: 'Full report',
                            url:
                                'https://media.biglotteryfund.org.uk/media/documents/youth-serious-violence-full-report.pdf?mtime=20180816092318',
                            filetype: 'pdf',
                            filesize: '824.72 KB',
                            contents: [
                                'Introduction',
                                'Key learning',
                                'An emerging evidence base?',
                                'Questions for funders',
                                'Appendices and bibliography'
                            ]
                        }
                    ]
                }
            ]);

            res.render(path.resolve(__dirname, './views/research-landing-new'), {
                researchEntries: researchEntriesWithMocks
            });
        });
    }

    router.get('/:slug', injectResearchEntry, injectBreadcrumbs, (req, res, next) => {
        const { researchEntry } = res.locals;

        if (researchEntry) {
            res.render(path.resolve(__dirname, './views/research-detail'), {
                entry: researchEntry,
                heroImage: researchEntry.hero || res.locals.fallbackHeroImage,
                isBilingual: isBilingual(researchEntry.availableLanguages)
            });
        } else {
            next();
        }
    });

    return router;
};
