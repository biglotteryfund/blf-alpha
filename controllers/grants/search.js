'use strict';
const path = require('path');
const express = require('express');
const config = require('config');
const router = express.Router();
const request = require('request-promise-native');
const querystring = require('querystring');
const { concat, pick, isEmpty, get, head, sampleSize } = require('lodash');
const nunjucks = require('nunjucks');
const Raven = require('raven');
const enGB = require('dictionary-en-gb');
const nspell = require('nspell');

const { PAST_GRANTS_API_URI } = require('../../modules/secrets');
const { injectHeroImage, injectCopy } = require('../../middleware/inject-content');
const contentApi = require('../../services/content-api');
const grantDataDates = config.get('grantData.dateRange');

const grantNavLink =
    'http://grantnav.threesixtygiving.org/search?json_query=%7B%22query%22%3A+%7B%22bool%22%3A+%7B%22filter%22%3A+%5B%7B%22bool%22%3A+%7B%22should%22%3A+%5B%7B%22term%22%3A+%7B%22fundingOrganization.id_and_name%22%3A+%22%5B%5C%22The+Big+Lottery+Fund%5C%22%2C+%5C%22360G-blf%5C%22%5D%22%7D%7D%5D%7D%7D%2C+%7B%22bool%22%3A+%7B%22should%22%3A+%5B%5D%7D%7D%2C+%7B%22bool%22%3A+%7B%22should%22%3A+%5B%5D%2C+%22must%22%3A+%7B%7D%7D%7D%2C+%7B%22bool%22%3A+%7B%22should%22%3A+%7B%22range%22%3A+%7B%22amountAwarded%22%3A+%7B%7D%7D%7D%2C+%22must%22%3A+%7B%7D%7D%7D%2C+%7B%22bool%22%3A+%7B%22should%22%3A+%5B%5D%7D%7D%2C+%7B%22bool%22%3A+%7B%22should%22%3A+%5B%5D%7D%7D%2C+%7B%22bool%22%3A+%7B%22should%22%3A+%5B%5D%7D%7D%2C+%7B%22bool%22%3A+%7B%22should%22%3A+%5B%5D%7D%7D%5D%2C+%22must%22%3A+%7B%22query_string%22%3A+%7B%22default_field%22%3A+%22_all%22%2C+%22query%22%3A+%22%2A%22%7D%7D%7D%7D%2C+%22sort%22%3A+%7B%22_score%22%3A+%7B%22order%22%3A+%22desc%22%7D%7D%2C+%22aggs%22%3A+%7B%22recipientDistrictName%22%3A+%7B%22terms%22%3A+%7B%22size%22%3A+3%2C+%22field%22%3A+%22recipientDistrictName%22%7D%7D%2C+%22currency%22%3A+%7B%22terms%22%3A+%7B%22size%22%3A+3%2C+%22field%22%3A+%22currency%22%7D%7D%2C+%22recipientOrganization%22%3A+%7B%22terms%22%3A+%7B%22size%22%3A+3%2C+%22field%22%3A+%22recipientOrganization.id_and_name%22%7D%7D%2C+%22fundingOrganization%22%3A+%7B%22terms%22%3A+%7B%22size%22%3A+3%2C+%22field%22%3A+%22fundingOrganization.id_and_name%22%7D%7D%2C+%22recipientRegionName%22%3A+%7B%22terms%22%3A+%7B%22size%22%3A+3%2C+%22field%22%3A+%22recipientRegionName%22%7D%7D%7D%2C+%22extra_context%22%3A+%7B%22awardYear_facet_size%22%3A+3%2C+%22amountAwardedFixed_facet_size%22%3A+3%7D%7D';

/**
 * Combine a ?page param with existing querystrings for grant search
 * @param {object} currentQuery
 * @param {number} page
 */
function makePageLink(currentQuery, page) {
    const withPage = Object.assign({}, currentQuery, { page });
    return '?' + querystring.stringify(withPage);
}

function buildPagination(paginationMeta, currentQuery = {}, labels) {
    if (paginationMeta && paginationMeta.totalPages > 1) {
        const currentPage = paginationMeta.currentPage;
        const totalPages = paginationMeta.totalPages;

        const prevLink = {
            url: makePageLink(currentQuery, currentPage - 1),
            label: labels.prev
        };

        const nextLink = {
            url: makePageLink(currentQuery, currentPage + 1),
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

/**
 * Pick out an allowed list of query parameters to forward on to the grants API
 */
function buildAllowedParams(queryParams) {
    const allowedParams = [
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
    ];
    return pick(queryParams, allowedParams);
}

/**
 * Append a page number parameter to a map of query parameters
 */
function addPaginationParameters(existingParams, pageNumber = 1) {
    return Object.assign({}, existingParams, { page: pageNumber });
}

// Query the API with a set of parameters and return a promise
async function queryGrantsApi(parameters) {
    return request({
        url: PAST_GRANTS_API_URI,
        json: true,
        qs: parameters
    });
}

function buildReturnLink(queryParams, urlBase = './') {
    // Try to construct a URL to return the user to their search
    let returnLink;
    if (queryParams.from === 'search') {
        delete queryParams.from;
        returnLink = urlBase + '?' + querystring.stringify(queryParams);
    }
    return returnLink;
}

async function checkSpelling(searchTerm) {
    return new Promise((resolve, reject) => {
        enGB((err, dict) => {
            const alphaNumeric = /[^a-zA-Z0-9 -]/g;
            let searchHadATypo = false;
            let suggestions = [];

            if (err) {
                return reject(err);
            }
            const spell = nspell(dict);

            searchTerm
                .split(' ')
                .forEach(word => {

                    const wordAlphaNumeric = word.replace(alphaNumeric, '');
                    const isCorrect = spell.correct(wordAlphaNumeric);
                    const wordSuggestions = isCorrect ? [] : spell.suggest(wordAlphaNumeric);

                    if (!searchHadATypo && !isCorrect) {
                        searchHadATypo = true;
                    }

                    if (wordSuggestions) {
                        suggestions = wordSuggestions.map(s => searchTerm.replace(word, s));
                    }
                });

            return resolve({
                searchHadATypo,
                suggestions
            });
        });
    });
}

router.get(
    '/',
    injectHeroImage('active-plus-communities'),
    injectCopy('funding.pastGrants.search'),
    async (req, res, next) => {
        let data;
        const facetParams = buildAllowedParams(req.query);
        const paginationLabels = req.i18n.__('global.misc.pagination');
        let queryWithPage = addPaginationParameters(facetParams, req.query.page);

        // Add a parameter so we know the user came from search
        // (so we can link them back to their results)
        const searchQueryString = querystring.stringify(
            Object.assign({}, queryWithPage, {
                from: 'search'
            })
        );

        queryWithPage.locale = res.locals.locale;

        try {
            data = await queryGrantsApi(queryWithPage);
        } catch (errorResponse) {
            return res.format({
                html: () => {
                    next(errorResponse.error);
                },
                'application/json': () => {
                    res.status(errorResponse.error.error.status || 400).json({
                        error: errorResponse.error.error
                    });
                }
            });
        }

        let searchSuggestions = false;
        if (data.meta.totalResults === 0) {
            searchSuggestions = await checkSpelling(req.query.q);
        }

        res.format({
            // Initial / server-only search
            html: async () => {
                // Grab some case studies
                const caseStudiesResponse = await contentApi.getCaseStudies({
                    locale: req.i18n.getLocale()
                });

                // Shuffle the valid case studies and grab the first few
                const caseStudies = sampleSize(caseStudiesResponse.filter(c => c.grantId), 3);

                res.render(path.resolve(__dirname, './views/search'), {
                    title: res.locals.copy.title,
                    queryParams: isEmpty(facetParams) ? false : facetParams,
                    grants: data.results,
                    facets: data.facets,
                    meta: data.meta,
                    grantDataDates: grantDataDates,
                    caseStudies: caseStudies,
                    grantNavLink: grantNavLink,
                    searchQueryString: searchQueryString,
                    searchSuggestions: searchSuggestions,
                    pagination: buildPagination(data.meta.pagination, queryWithPage, paginationLabels)
                });
            },

            // AJAX search for client-side app
            'application/json': () => {
                const isRelatedSearch = req.query.related === 'true';

                // Repopulate existing app globals so Nunjucks can read them
                // outside of Express's view engine context
                const context = Object.assign({}, res.locals, req.app.locals, {
                    grants: data.results,
                    searchQueryString: searchQueryString,
                    pagination: buildPagination(data.meta.pagination, queryWithPage, paginationLabels),
                    options: {
                        wrapperClass: isRelatedSearch ? 'flex-grid__item' : false,
                        hidePagination: isRelatedSearch
                    }
                });
                const template = path.resolve(__dirname, './views/ajax-results.njk');

                nunjucks.render(template, context, (renderErr, html) => {
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
    }
);

router.get('/recipients/:id', injectCopy('funding.pastGrants.search'), async (req, res, next) => {
    try {
        let qs = addPaginationParameters({}, req.query.page);
        qs.recipient = req.params.id;
        qs.locale = res.locals.locale;
        const data = await request({
            url: PAST_GRANTS_API_URI,
            json: true,
            qs: qs
        });

        const paginationLabels = req.i18n.__('global.misc.pagination');

        if (data && data.meta.totalResults > 0) {
            const firstResult = head(data.results);
            const organisation = head(firstResult.recipientOrganization);
            res.render(path.resolve(__dirname, './views/recipient-detail'), {
                title: organisation.name,
                organisation: organisation,
                recipientGrants: data.results,
                recipientProgrammes: data.facets.grantProgramme,
                recipientLocalAuthorities: data.facets.localAuthorities,
                totalAwarded: data.meta.totalAwarded.toLocaleString(),
                totalResults: data.meta.totalResults.toLocaleString(),
                breadcrumbs: concat(res.locals.breadcrumbs, { label: organisation.name }),
                returnLink: buildReturnLink(req.query, '../'),
                pagination: buildPagination(data.meta.pagination, qs, paginationLabels)
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
        const data = await request({
            url: `${PAST_GRANTS_API_URI}/${req.params.id}`,
            json: true,
            qs: {
                locale: res.locals.locale
            }
        });

        if (data) {
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
                fundingProgramme: fundingProgramme,
                returnLink: buildReturnLink(req.query),
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
