'use strict';

const ab = require('express-ab');
const config = require('config');
const moment = require('moment');
const Raven = require('raven');
const { assign, find, findIndex, get, last, map, uniq } = require('lodash');

const cached = require('../../middleware/cached');
const { splitPercentages } = require('../../modules/ab');
const { heroImages } = require('../../modules/images');
const { addPreviewStatus } = require('../../modules/preview');
const { isBilingual } = require('../../modules/pageLogic');
const appData = require('../../modules/appData');
const contentApi = require('../../services/content-api');

const programmeFilters = {
    getValidLocation(programmes, requestedLocation) {
        const validLocations = programmes
            .map(programme => get(programme, 'content.area.value', false))
            .filter(location => location !== false);

        const uniqLocations = uniq(validLocations);
        return find(uniqLocations, location => location === requestedLocation);
    },
    filterByLocation(locationValue) {
        return function(programme) {
            if (!locationValue) {
                return programme;
            }

            return (
                !programme.content.area ||
                get(programme.content, 'area.value') === 'ukWide' ||
                get(programme.content, 'area.value') === locationValue
            );
        };
    },
    filterByMinAmount(minAmount) {
        return function(programme) {
            if (!minAmount) {
                return programme;
            }

            const data = programme.content;
            const min = parseInt(minAmount, 10);
            return !data.fundingSize || !min || data.fundingSize.minimum >= min;
        };
    },
    filterByMaxAmount(maxAmount) {
        return function(programme) {
            if (!maxAmount) {
                return programme;
            }

            const max = parseInt(maxAmount, 10);
            const programmeMax = get(programme, 'content.fundingSize.maximum');
            return programmeMax <= max || false;
        };
    }
};

function initProgrammesList(router, options) {
    router.get(options.path, (req, res, next) => {
        const lang = req.i18n.__(options.lang);
        const templateData = {
            copy: lang,
            title: lang.title,
            programmes: [],
            activeFacets: [],
            activeBreadcrumbs: []
        };

        contentApi
            .getFundingProgrammes({
                locale: req.i18n.getLocale()
            })
            .then(programmes => {
                const locationParam = programmeFilters.getValidLocation(programmes, req.query.location);
                const minAmountParam = req.query.min;
                const maxAmountParam = req.query.max;

                templateData.programmes = programmes
                    .filter(programmeFilters.filterByLocation(locationParam))
                    .filter(programmeFilters.filterByMinAmount(minAmountParam))
                    .filter(programmeFilters.filterByMaxAmount(maxAmountParam));

                if (!minAmountParam && !maxAmountParam && !locationParam) {
                    templateData.activeBreadcrumbs = [
                        {
                            label: req.i18n.__(options.lang + '.breadcrumbAll')
                        }
                    ];
                } else {
                    templateData.activeBreadcrumbs.push({
                        label: req.i18n.__(options.lang + '.title'),
                        url: req.originalUrl.split('?').shift()
                    });

                    if (parseInt(minAmountParam, 10) === 10000) {
                        templateData.activeBreadcrumbs.push({
                            label: req.i18n.__(options.lang + '.over10k'),
                            url: '/over10k'
                        });
                    }

                    if (parseInt(maxAmountParam, 10) === 10000) {
                        templateData.activeBreadcrumbs.push({
                            label: req.i18n.__(options.lang + '.under10k'),
                            url: '/under10k'
                        });
                    }

                    if (locationParam) {
                        const locationParamToTranslation = key => {
                            const regions = {
                                england: req.i18n.__('global.regions.england'),
                                wales: req.i18n.__('global.regions.wales'),
                                scotland: req.i18n.__('global.regions.scotland'),
                                northernIreland: req.i18n.__('global.regions.northernIreland'),
                                ukWide: req.i18n.__('global.regions.ukWide')
                            };
                            return regions[key];
                        };

                        templateData.activeBreadcrumbs.push({
                            label: locationParamToTranslation(locationParam)
                        });
                    }
                }

                templateData.activeBreadcrumbsSummary = map(templateData.activeBreadcrumbs, 'label').join(', ');

                res.render(options.template, templateData);
            })
            .catch(err => {
                err.friendlyText = 'Unable to load funding programmes';
                next(err);
            });
    });
}

function renderProgrammeDetail({ res, entry }) {
    addPreviewStatus(res, entry);

    res.render('pages/funding/programme-detail', {
        entry: entry,
        title: entry.summary.title,
        isBilingual: isBilingual(entry.availableLanguages),
        heroImage: entry.hero || heroImages.rathlinIslandDevelopment
    });
}

function handleProgrammeDetail(slug) {
    return function(req, res, next) {
        const locale = req.i18n.getLocale();
        contentApi
            .getFundingProgramme({
                slug: slug,
                locale: locale,
                previewMode: res.locals.PREVIEW_MODE || false
            })
            .then(entry => {
                if (entry.contentSections.length > 0) {
                    renderProgrammeDetail({ res, entry });
                } else {
                    throw new Error('NoContent');
                }
            })
            .catch(err => {
                err.statusCode !== '404' && Raven.captureException(err);
                next();
            });
    };
}

function initProgrammeDetail(router) {
    router.get('/programmes/:slug', (req, res, next) => {
        handleProgrammeDetail(req.params.slug)(req, res, next);
    });
}

function initProgrammeDetailAwardsForAll(router, options) {
    const testFn = ab.test('blf-afa-rollout-england', {
        cookie: {
            name: config.get('cookies.abTestAwardsForAll'),
            maxAge: moment.duration(4, 'weeks').asMilliseconds()
        },
        id: options.experimentId
    });

    const percentageForTest = config.get('abTests.tests.awardsForAll.percentage');
    const percentages = splitPercentages(percentageForTest);

    const getSlug = urlPath => last(urlPath.split('/'));

    function renderVariantA(req, res, next) {
        handleProgrammeDetail(getSlug(req.path))(req, res, next);
    }

    function renderVariantB(req, res, next) {
        const locale = req.i18n.getLocale();
        const slug = getSlug(req.path);
        contentApi
            .getFundingProgramme({ locale, slug })
            .then(entry => {
                if (entry.contentSections.length > 0) {
                    const applyTabIdx = findIndex(entry.contentSections, section => {
                        return section.title.match(/How do you apply|Sut ydych chi'n ymgeisio/);
                    });

                    if (applyTabIdx !== -1) {
                        const applyUrl = locale === 'cy' ? `${options.applyUrl}&lang=welsh` : options.applyUrl;
                        const originalTextFromCMS = entry.contentSections[applyTabIdx].body;
                        const awardsTextToPrepend = req.i18n.__('global.abTests.awardsForAllOnlineForm', applyUrl);
                        entry.contentSections[applyTabIdx] = assign({}, entry.contentSections[applyTabIdx], {
                            body: awardsTextToPrepend + originalTextFromCMS
                        });
                    } else {
                        Raven.captureMessage('Failed to modify Awards For All page');
                    }

                    renderProgrammeDetail({
                        res,
                        entry
                    });
                } else {
                    throw new Error('NoContent');
                }
            })
            .catch(err => {
                err.statusCode !== '404' && Raven.captureException(err);
                next();
            });
    }

    router.get(options.path, cached.noCache, testFn(null, percentages.A), renderVariantA);
    router.get(options.path, cached.noCache, testFn(null, percentages.B), renderVariantB);

    /**
     * Expose preview URLs to see test variants directly
     */
    if (appData.isNotProduction) {
        router.get(`${options.path}/a`, (req, res, next) => {
            req.url = options.path;
            renderVariantA(req, res, next);
        });

        router.get(`${options.path}/b`, (req, res, next) => {
            req.url = options.path;
            renderVariantB(req, res, next);
        });
    }
}

function init({ router, routeConfig }) {
    initProgrammesList(router, routeConfig.programmes);
    if (config.get('abTests.enabled')) {
        [routeConfig.programmeDetailAfaScotland].forEach(route => {
            initProgrammeDetailAwardsForAll(router, route);
        });
    }
    initProgrammeDetail(router);
}

module.exports = {
    init,
    programmeFilters
};
