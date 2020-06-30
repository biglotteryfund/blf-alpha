'use strict';
const path = require('path');
const config = require('config');
const Sentry = require('@sentry/node');
const express = require('express');
const nunjucks = require('nunjucks');
const querystring = require('querystring');
const clone = require('lodash/clone');
const get = require('lodash/get');
const isEmpty = require('lodash/isEmpty');
const pick = require('lodash/pick');

const {
    injectHeroImage,
    setHeroLocals,
} = require('../../../common/inject-content');
const { sMaxAge } = require('../../../common/cached');
const contentApi = require('../../../common/content-api');

const grantsService = require('./grants-service');

const router = express.Router();

router.use(sMaxAge(604800 /* 7 days in seconds */), function (req, res, next) {
    res.locals.breadcrumbs = res.locals.breadcrumbs.concat({
        label: req.i18n.__('funding.pastGrants.search.title'),
        url: req.baseUrl,
    });
    next();
});

function buildPagination(req, paginationMeta, currentQuery = {}) {
    if (paginationMeta && paginationMeta.totalPages > 1) {
        const labels = req.i18n.__('global.misc.pagination');

        const currentPage = paginationMeta.currentPage;
        const totalPages = paginationMeta.totalPages;

        const prevLink = {
            url:
                '?' +
                querystring.stringify({
                    ...currentQuery,
                    ...{ page: currentPage - 1 },
                }),
            label: labels.prev,
        };

        const nextLink = {
            url:
                '?' +
                querystring.stringify({
                    ...currentQuery,
                    ...{ page: currentPage + 1 },
                }),
            label: labels.next,
        };

        return {
            currentPage: currentPage,
            totalPages: totalPages,
            prevLink: currentPage > 1 ? prevLink : null,
            nextLink: currentPage < totalPages ? nextLink : null,
        };
    } else {
        return;
    }
}

router.get(
    '/',
    injectHeroImage('search-all-grants-letterbox-new'),
    async function (req, res, next) {
        try {
            const locale = req.i18n.getLocale();

            res.locals.copy = req.i18n.__('funding.pastGrants.search');

            /**
             * Pick out an allowed list of query parameters to forward on to the grants API
             */
            const facetParams = pick(req.query, [
                'q',
                'amount',
                'postcode',
                'programme',
                'year',
                'orgType',
                'sort',
                'country',
                'awardDate',
                'localAuthority',
                'westminsterConstituency',
                'recipient',
                'exclude',
                'limit',
            ]);

            const queryWithPage = {
                ...facetParams,
                ...{ page: req.query.page || 1, locale },
            };

            const data = await grantsService.query(queryWithPage);

            let searchSuggestions = false;
            if (data.meta.totalResults === 0 && req.query.q) {
                searchSuggestions = get(data.meta, 'searchSuggestions', null);
            }

            res.format({
                // Initial / server-only search
                'html': async () => {
                    res.render(path.resolve(__dirname, './views/search'), {
                        title: req.i18n.__('funding.pastGrants.search.title'),
                        queryParams: isEmpty(facetParams) ? false : facetParams,
                        grants: data.results,
                        facets: data.facets,
                        meta: data.meta,
                        grantDataDates: data.meta.grantDates,
                        searchSuggestions: searchSuggestions,
                        pagination: buildPagination(
                            req,
                            data.meta.pagination,
                            queryWithPage
                        ),
                    });
                },

                // AJAX search for client-side app
                'application/json': () => {
                    /**
                     * Repopulate existing app globals so Nunjucks
                     * can read them outside of Express's view engine context
                     */
                    const extraContext = {
                        grants: data.results,
                        pagination: buildPagination(
                            req,
                            data.meta.pagination,
                            queryWithPage
                        ),
                    };

                    const context = {
                        ...res.locals,
                        ...req.app.locals,
                        ...extraContext,
                    };

                    nunjucks.render(
                        path.resolve(__dirname, './views/ajax-results.njk'),
                        context,
                        (renderErr, html) => {
                            if (renderErr) {
                                Sentry.captureException(renderErr);
                                res.status(400).json({
                                    error: 'ERR-TEMPLATE-ERROR',
                                });
                            } else {
                                res.json({
                                    meta: data.meta,
                                    facets: data.facets,
                                    searchSuggestions: searchSuggestions,
                                    resultsHtml: html,
                                });
                            }
                        }
                    );
                },
            });
        } catch (errorResponse) {
            return res.format({
                'html': () => {
                    next(errorResponse.error);
                },
                'application/json': () => {
                    Sentry.captureMessage(errorResponse);
                    res.status(errorResponse.error.error.status || 400).json({
                        error: errorResponse.error.error,
                    });
                },
            });
        }
    }
);

if (config.get('features.enableRelatedGrants')) {
    router.get('/related', async function (req, res, next) {
        try {
            if (isEmpty(req.query)) {
                return next();
            }

            res.locals.copy = req.i18n.__('funding.pastGrants.search');

            const apiQuery = clone(req.query);
            apiQuery.locale = res.locals.locale;
            const data = await grantsService.query(apiQuery);

            /**
             * Repopulate existing app globals so Nunjucks
             * can read them outside of Express's view engine context
             */
            const extraContext = { grants: data.results };
            const context = {
                ...res.locals,
                ...req.app.locals,
                ...extraContext,
            };

            nunjucks.render(
                path.resolve(__dirname, './views/ajax-related.njk'),
                context,
                (renderErr, html) => {
                    if (renderErr) {
                        Sentry.captureException(renderErr);
                        res.status(400).json({
                            error: 'ERR-TEMPLATE-ERROR',
                        });
                    } else {
                        res.json({
                            meta: data.meta,
                            resultsHtml: html,
                        });
                    }
                }
            );
        } catch (rawError) {
            const errorResponse = rawError.error.error;
            return res.status(errorResponse.status || 400).json({
                error: errorResponse,
            });
        }
    });
}

router.get('/recipients/:id', async function (req, res, next) {
    try {
        res.locals.copy = req.i18n.__('funding.pastGrants.search');

        const data = await grantsService.getRecipientById({
            id: req.params.id,
            locale: req.i18n.getLocale(),
            page: req.query.page,
        });

        const organisation = get(data, 'results[0].recipientOrganization[0]');

        if (organisation) {
            res.render(path.resolve(__dirname, './views/recipient-detail'), {
                title: organisation.name,
                organisation: organisation,
                recipientGrants: data.results,
                recipientProgrammes: data.facets.grantProgramme,
                recipientLocalAuthorities: data.facets.localAuthorities,
                totalAwarded: data.meta.totalAwarded.toLocaleString(),
                totalResults: data.meta.totalResults.toLocaleString(),
                breadcrumbs: res.locals.breadcrumbs.concat({
                    label: organisation.name,
                }),
                pagination: buildPagination(req, data.meta.pagination),
            });
        } else {
            next();
        }
    } catch (error) {
        next(error);
    }
});

router.get('/:id', async function (req, res, next) {
    try {
        res.locals.copy = req.i18n.__('funding.pastGrants.search');

        const data = await grantsService.getGrantById({
            id: req.params.id,
            locale: req.i18n.getLocale(),
        });

        let projectStory;
        try {
            projectStory = await contentApi({
                flags: res.locals,
            }).getProjectStory({
                locale: req.i18n.getLocale(),
                grantId: req.params.id,
                requestParams: req.query,
            });
            setHeroLocals({ res, entry: projectStory });
        } catch (e) {} // eslint-disable-line no-empty

        if (data && data.result) {
            let fundingProgramme;
            const grant = data.result;
            res.locals.openGraph = get(projectStory, 'openGraph', false);
            const grantProgramme = get(grant, 'grantProgramme[0]', false);
            if (
                grantProgramme &&
                grantProgramme.url &&
                grantProgramme.url.indexOf('/') === -1
            ) {
                try {
                    fundingProgramme = await contentApi({
                        flags: res.locals,
                    }).getFundingProgramme({
                        slug: grantProgramme.url,
                        locale: req.i18n.getLocale(),
                    });
                } catch (e) {} // eslint-disable-line no-empty
            }

            res.render(path.resolve(__dirname, './views/grant-detail'), {
                title: data.result.title,
                grant: grant,
                content: projectStory,
                fundingProgramme: fundingProgramme,
                breadcrumbs: res.locals.breadcrumbs.concat({
                    label: data.result.title,
                }),
            });
        } else {
            next();
        }
    } catch (error) {
        next(error);
    }
});

module.exports = router;
