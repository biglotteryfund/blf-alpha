const queryString = require('query-string');
const { includes, reduce, toString } = require('lodash');

const { legacyProxiedRoutes } = require('../routes');
const { localify } = require('../../modules/urls');
const { proxyLegacyPage, postToLegacyForm } = require('../../modules/proxy');

/**
 * Normalize query
 * Old format URLs often get passed through as: ?area=Scotland&amp;amount=10001 - 50000
 * urlencoded &amp; needs to be normalised when fetching individual query param
 */
function normaliseQuery(originalQuery) {
    function reducer(newQuery, value, key) {
        const prefix = 'amp;';
        if (includes(key, prefix)) {
            newQuery[key.replace(prefix, '')] = value;
        } else {
            newQuery[key] = value;
        }

        return newQuery;
    }

    return reduce(originalQuery, reducer, {});
}

function reformatQueryString({ originalAreaQuery, originalAmountQuery }) {
    originalAreaQuery = toString(originalAreaQuery).toLowerCase();
    originalAmountQuery = toString(originalAmountQuery).toLowerCase();

    let newQuery = {};
    if (originalAreaQuery) {
        newQuery.location = {
            england: 'england',
            'northern ireland': 'northernIreland',
            scotland: 'scotland',
            wales: 'wales',
            'uk-wide': 'ukWide'
        }[originalAreaQuery];
    }

    if (originalAmountQuery && originalAmountQuery === 'up to 10000') {
        newQuery.max = '10000';
    } else if (originalAmountQuery && originalAmountQuery !== 'up to 10000') {
        newQuery.min = '10000';
    }

    return queryString.stringify(newQuery);
}

/**
 * Legacy funding finder
 * Proxy the legacy funding finder for closed programmes (where `sc` query is present)
 * For all other requests normalise the query string and redirect to the new funding programmes list.
 */
function initLegacyFundingFinder(router) {
    const fundingFinderPaths = [legacyProxiedRoutes.fundingFinder.path, legacyProxiedRoutes.fundingFinderWelsh.path];

    fundingFinderPaths.forEach(mountPath => {
        router
            .get(mountPath, (req, res) => {
                req.query = normaliseQuery(req.query);
                const showClosed = parseInt(req.query.sc, 10) === 1;

                if (showClosed) {
                    // Proxy legacy funding finder for closed programmes
                    return proxyLegacyPage(req, res, dom => dom, mountPath);
                } else {
                    // Redirect from funding finder to new programmes page
                    const newQuery = reformatQueryString({
                        originalAreaQuery: req.query.area,
                        originalAmountQuery: req.query.amount
                    });

                    const redirectUrl = localify({
                        urlPath: '/funding/programmes' + (newQuery.length > 0 ? `?${newQuery}` : ''),
                        locale: req.i18n.getLocale()
                    });

                    res.redirect(301, redirectUrl);
                }
            })
            .post(mountPath, postToLegacyForm);
    });
}

function init(router) {
    initLegacyFundingFinder(router);
}

module.exports = {
    init,
    normaliseQuery,
    reformatQueryString
};
