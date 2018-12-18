'use strict';
const { concat, clone, pick, isEmpty, get } = require('lodash');
const path = require('path');
const config = require('config');
const Raven = require('raven');
const express = require('express');
const nunjucks = require('nunjucks');

const querystring = require('querystring');
const nspell = require('nspell');
const cyGB = require('dictionary-cy-gb');
const enGB = require('dictionary-en-gb');

const { injectBreadcrumbs, injectCopy, injectHeroImage, setHeroLocals } = require('../../middleware/inject-content');
const { sMaxAge } = require('../../middleware/cached');
const contentApi = require('../../services/content-api');
const grantsService = require('../../services/grants');

const grantsConfig = config.get('grants');

const router = express.Router();

router.use(sMaxAge('7d'), injectBreadcrumbs, (req, res, next) => {
    res.locals.breadcrumbs = concat(res.locals.breadcrumbs, {
        label: req.i18n.__('funding.pastGrants.search.title'),
        url: req.baseUrl
    });
    next();
});

function buildPagination(req, paginationMeta, currentQuery = {}) {
    if (paginationMeta && paginationMeta.totalPages > 1) {
        const labels = req.i18n.__('global.misc.pagination');

        const currentPage = paginationMeta.currentPage;
        const totalPages = paginationMeta.totalPages;

        const prevLink = {
            url: '?' + querystring.stringify({ ...currentQuery, ...{ page: currentPage - 1 } }),
            label: labels.prev
        };

        const nextLink = {
            url: '?' + querystring.stringify({ ...currentQuery, ...{ page: currentPage + 1 } }),
            label: labels.next
        };

        return {
            currentPage: currentPage,
            totalPages: totalPages,
            prevLink: currentPage > 1 ? prevLink : null,
            nextLink: currentPage < totalPages ? nextLink : null
        };
    } else {
        return;
    }
}

async function checkSpelling(searchTerm, locale = 'en') {
    const dictToUse = locale === 'cy' ? cyGB : enGB;
    return new Promise((resolve, reject) => {
        dictToUse((err, dict) => {
            const alphaNumeric = /[^a-zA-Z0-9 -]/g;
            let searchHadATypo = false;
            let suggestions = [];

            if (err) {
                return reject(err);
            }
            const spell = nspell(dict);

            searchTerm.split(' ').forEach(word => {
                const wordAlphaNumeric = word.replace(alphaNumeric, '');
                const isCorrect = spell.correct(wordAlphaNumeric);
                const wordSuggestions = isCorrect ? [] : spell.suggest(wordAlphaNumeric);

                if (!searchHadATypo && !isCorrect) {
                    searchHadATypo = true;
                }

                // Build up a list of replaced words (allowing for multiple typos)
                if (wordSuggestions.length > 0) {
                    if (suggestions.length === 0) {
                        suggestions = wordSuggestions.map(fixedWord => searchTerm.replace(word, fixedWord));
                    } else {
                        suggestions = suggestions.map(s => {
                            let fixedSuggestion = s;
                            wordSuggestions.forEach(fixedWord => {
                                fixedSuggestion = fixedSuggestion.replace(word, fixedWord);
                            });
                            return fixedSuggestion;
                        });
                    }
                }
            });

            return resolve({
                searchHadATypo,
                suggestions
            });
        });
    });
}

router.get('/', injectHeroImage('tinylife'), injectCopy('funding.pastGrants.search'), async (req, res, next) => {
    try {
        const locale = req.i18n.getLocale();

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
            'limit'
        ]);

        const queryWithPage = { ...facetParams, ...{ page: req.query.page || 1, locale } };
        const data = await grantsService.query(queryWithPage);

        let searchSuggestions = false;
        if (data.meta.totalResults === 0 && req.query.q) {
            searchSuggestions = await checkSpelling(req.query.q, locale);
        }

        res.format({
            // Initial / server-only search
            html: async () => {
                res.render(path.resolve(__dirname, './views/search'), {
                    title: res.locals.copy.title,
                    queryParams: isEmpty(facetParams) ? false : facetParams,
                    grants: data.results,
                    facets: data.facets,
                    meta: data.meta,
                    grantDataDates: grantsConfig.dateRange,
                    grantNavLink: grantsConfig.grantNavLink,
                    searchSuggestions: searchSuggestions,
                    pagination: buildPagination(req, data.meta.pagination, queryWithPage)
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
                    pagination: buildPagination(req, data.meta.pagination, queryWithPage)
                };

                const context = { ...res.locals, ...req.app.locals, ...extraContext };

                nunjucks.render(path.resolve(__dirname, './views/ajax-results.njk'), context, (renderErr, html) => {
                    if (renderErr) {
                        Raven.captureException(renderErr);
                        res.status(400).json({ error: 'ERR-TEMPLATE-ERROR' });
                    } else {
                        res.json({
                            meta: data.meta,
                            facets: data.facets,
                            searchSuggestions: searchSuggestions,
                            resultsHtml: html
                        });
                    }
                });
            }
        });
    } catch (errorResponse) {
        return res.format({
            html: () => {
                next(errorResponse.error);
            },
            'application/json': () => {
                Raven.captureMessage(errorResponse);
                res.status(errorResponse.error.error.status || 400).json({
                    error: errorResponse.error.error
                });
            }
        });
    }
});

if (config.get('features.enableRelatedGrants')) {
    router.get('/related', injectCopy('funding.pastGrants.search'), async (req, res, next) => {
        try {
            if (isEmpty(req.query)) {
                return next();
            }

            const apiQuery = clone(req.query);
            apiQuery.locale = res.locals.locale;
            const data = await grantsService.query(apiQuery);

            /**
             * Repopulate existing app globals so Nunjucks
             * can read them outside of Express's view engine context
             */
            const extraContext = { grants: data.results };
            const context = { ...res.locals, ...req.app.locals, ...extraContext };

            nunjucks.render(path.resolve(__dirname, './views/ajax-related.njk'), context, (renderErr, html) => {
                if (renderErr) {
                    Raven.captureException(renderErr);
                    res.status(400).json({ error: 'ERR-TEMPLATE-ERROR' });
                } else {
                    res.json({
                        meta: data.meta,
                        resultsHtml: html
                    });
                }
            });
        } catch (rawError) {
            const errorResponse = rawError.error.error;
            return res.status(errorResponse.status || 400).json({
                error: errorResponse
            });
        }
    });
}

router.get('/recipients/:id', injectCopy('funding.pastGrants.search'), async (req, res, next) => {
    try {
        const data = await grantsService.query({
            page: req.query.page || 1,
            recipient: req.params.id,
            locale: req.i18n.getLocale()
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
                breadcrumbs: concat(res.locals.breadcrumbs, { label: organisation.name }),
                pagination: buildPagination(req, data.meta.pagination)
            });
        } else {
            next();
        }
    } catch (error) {
        next(error);
    }
});

router.get('/:id', injectCopy('funding.pastGrants.search'), async (req, res, next) => {
    try {
        const data = await grantsService.getById({ id: req.params.id, locale: req.i18n.getLocale() });

        let projectStory;
        try {
            projectStory = await contentApi.getProjectStory({
                locale: req.i18n.getLocale(),
                grantId: req.params.id
            });
            setHeroLocals({ res, entry: projectStory });
        } catch (e) {} // eslint-disable-line no-empty

        if (data && data.result) {
            let fundingProgramme;
            const grant = data.result;
            const grantProgramme = get(grant, 'grantProgramme[0]', false);
            if (grantProgramme && grantProgramme.url && grantProgramme.url.indexOf('/') === -1) {
                try {
                    fundingProgramme = await contentApi.getFundingProgramme({
                        slug: grantProgramme.url,
                        locale: req.i18n.getLocale()
                    });
                } catch (e) {} // eslint-disable-line no-empty
            }

            res.render(path.resolve(__dirname, './views/grant-detail'), {
                title: data.result.title,
                grant: grant,
                projectStory: projectStory,
                fundingProgramme: fundingProgramme,
                breadcrumbs: concat(res.locals.breadcrumbs, { label: data.result.title })
            });
        } else {
            next();
        }
    } catch (error) {
        next(error);
    }
});

module.exports = router;
