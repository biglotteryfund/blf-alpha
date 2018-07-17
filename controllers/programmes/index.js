'use strict';
const path = require('path');
const { map } = require('lodash');

const { heroImages } = require('../../modules/images');
const { injectFundingProgramme, injectFundingProgrammes } = require('../../middleware/inject-content');
const { isBilingual } = require('../../modules/pageLogic');
const { localify, normaliseQuery } = require('../../modules/urls');
const { programmeFilters, reformatQueryString } = require('./helpers');
const { proxyLegacyPage, postToLegacyForm } = require('../../modules/legacy');
const { redirectWithError } = require('../http-errors');
const { stripCSPHeader } = require('../../middleware/securityHeaders');

/**
 * Route: Legacy funding finder
 * Proxy the legacy funding finder for closed programmes (where `sc` query is present)
 * For all other requests normalise the query string and redirect to the new funding programmes list.
 */
function initLegacyFundingFinder({ router, routeConfig }) {
    router
        .route(routeConfig.path)
        .get(stripCSPHeader, (req, res) => {
            req.query = normaliseQuery(req.query);
            const showClosed = parseInt(req.query.sc, 10) === 1;
            const programmesUrl = localify(req.i18n.getLocale())('/funding/programmes');

            if (showClosed) {
                // Proxy legacy funding finder for closed programmes
                proxyLegacyPage({ req, res }).catch(error => {
                    redirectWithError(res, error, programmesUrl);
                });
            } else {
                // Redirect from funding finder to new programmes page
                const newQuery = reformatQueryString({
                    originalAreaQuery: req.query.area,
                    originalAmountQuery: req.query.amount
                });

                const redirectUrl = programmesUrl + (newQuery.length > 0 ? `?${newQuery}` : '');

                res.redirect(301, redirectUrl);
            }
        })
        .post(postToLegacyForm);
}

/**
 * Route: Programmes Listing
 */
function initProgrammesList({ router, routeConfig }) {
    router.get(routeConfig.path, injectFundingProgrammes, (req, res, next) => {
        const { copy, fundingProgrammes } = res.locals;
        const globalCopy = req.i18n.__('global');

        if (!fundingProgrammes) {
            next();
        }

        const templateData = {
            programmes: [],
            activeFacets: [],
            activeBreadcrumbs: []
        };

        const locationParam = programmeFilters.getValidLocation(fundingProgrammes, req.query.location);
        const minAmountParam = req.query.min;
        const maxAmountParam = req.query.max;

        templateData.programmes = fundingProgrammes
            .filter(programmeFilters.filterByLocation(locationParam))
            .filter(programmeFilters.filterByMinAmount(minAmountParam))
            .filter(programmeFilters.filterByMaxAmount(maxAmountParam));

        templateData.activeBreadcrumbs.push({
            label: globalCopy.nav.funding,
            url: req.baseUrl
        });

        if (!minAmountParam && !maxAmountParam && !locationParam) {
            templateData.activeBreadcrumbs.push({
                label: copy.breadcrumbAll
            });
        } else {
            templateData.activeBreadcrumbs.push({
                label: copy.title,
                url: req.baseUrl + req.path
            });

            if (parseInt(minAmountParam, 10) === 10000) {
                templateData.activeBreadcrumbs.push({
                    label: copy.over10k,
                    url: '/over10k'
                });
            }

            if (parseInt(maxAmountParam, 10) === 10000) {
                templateData.activeBreadcrumbs.push({
                    label: copy.under10k,
                    url: '/under10k'
                });
            }

            if (locationParam) {
                const locationParamToTranslation = key => {
                    const regions = {
                        england: globalCopy.regions.england,
                        wales: globalCopy.regions.wales,
                        scotland: globalCopy.regions.scotland,
                        northernIreland: globalCopy.regions.northernIreland,
                        ukWide: globalCopy.regions.ukWide
                    };
                    return regions[key];
                };

                templateData.activeBreadcrumbs.push({
                    label: locationParamToTranslation(locationParam),
                    count: templateData.programmes.length
                });
            }
        }

        templateData.activeBreadcrumbsSummary = map(templateData.activeBreadcrumbs, 'label').join(', ');

        res.render(path.resolve(__dirname, './views/programmes-list'), templateData);
    });
}

/**
 * Route: Programme Detail
 */
function initProgrammeDetail(router) {
    router.get('/programmes/:slug', injectFundingProgramme, (req, res, next) => {
        const entry = res.locals.fundingProgramme;

        if (entry && entry.contentSections.length > 0) {
            res.render(path.resolve(__dirname, './views/programme'), {
                entry: entry,
                title: entry.summary.title,
                heroImage: entry.hero || heroImages.fallbackHeroImage,
                isBilingual: isBilingual(entry.availableLanguages)
            });
        } else {
            next();
        }
    });
}

/**
 * Route Strategic Programme Detail
 */
function initStrategicProgrammeDetail(router) {
    router.get('/strategic/headstart', function(req, res) {
        // Mock entry
        const entry = {
            availableLanguages: ['en', 'cy'],
            status: 'live',
            title: 'HeadStart',
            intro: `<p>
                Improving the mental health and wellbeing of young people
            </p>
            <p>
                Working in six diverse communities across England, it aims to explore
                and test ways to improve young people’s mental health and wellbeing
            </p>
            `,
            aims: `<p>
                <strong>HeadStart is a five-year National Lottery funded programme set up by the
                Big Lottery Fund, the largest funder of community activity in the UK.</strong>
            </p>
            <p>
                Working in six diverse communities across England, it aims to explore and test ways to improve young
                people’s mental health and wellbeing.
            </p>
            <p>
                It is one of five major programmes set up by the Big Lottery Fund to trial new approaches to service
                design, which aim to make people’s lives healthier and happier, from babies and very young children
                through to those in later life.
            </p>
            <p>
                Big Lottery Fund believes that strong communities are built by those who live in them, and that people
                with first-hand experience of living with an issue are best-placed to identify and shape potential
                solutions. Young people, who identified mental health as a key issue in their lives, were at the heart of
                designing HeadStart.
            </p>
            <p>
                From 2016 to 2021, six local authority led HeadStart partnerships will be working in Blackpool,
                Cornwall, Hull, Kent, Newham and Wolverhampton.

            </p>`,
            impact: {},
            partnerships: [
                {
                    title: 'Our programme partners',
                    intro: `<p>Lorem ipsum dolor sit amet consectetur, adipisicing elit. Ab, ratione accusamus? Enim minima tempora in ipsum nesciunt et nihil temporibus!</p>`,
                    partners: [
                        {
                            title: 'HeadStart Blackpool',
                            subtitle: '£18.4 million',
                            description:
                                'Lorem ipsum dolor sit amet consectetur, adipisicing elit. Ab, ratione accusamus, wnim minima tempora in ipsum nesciunt et nihil temporibus.'
                        },
                        {
                            title: 'HeadStart Blackpool',
                            subtitle: '£18.4 million',
                            description: 'Lorem ipsum dolor sit amet consectetur.'
                        },
                        {
                            title: 'HeadStart Blackpool',
                            subtitle: '£18.4 million',
                            description:
                                'Ab, ratione accusamus, wnim minima tempora in ipsum nesciunt et nihil temporibus.'
                        }
                    ]
                }
            ]
        };

        const activeBreadcrumbs = [
            {
                label: req.i18n.__('global.nav.funding'),
                url: req.baseUrl
            },
            {
                label: 'Strategic programmes',
                url: req.baseUrl + '/strategic'
            },
            {
                label: entry.title
            }
        ];

        res.render(path.resolve(__dirname, './views/strategic-programme'), {
            entry: entry,
            title: entry.title,
            heroImage: entry.hero || heroImages.fallbackHeroImage,
            isBilingual: isBilingual(entry.availableLanguages),
            activeBreadcrumbs
        });
    });
}

function init({ router, routeConfigs }) {
    initProgrammesList({
        router: router,
        routeConfig: routeConfigs.programmes
    });

    initProgrammeDetail(router);

    initLegacyFundingFinder({
        router: router,
        routeConfig: routeConfigs.fundingFinderLegacy
    });

    if (process.env.NODE_ENV !== 'production') {
        initStrategicProgrammeDetail(router);
    }
}

module.exports = {
    init
};
