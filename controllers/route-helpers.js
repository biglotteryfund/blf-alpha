const { compact, compose, concat, filter, flatMap, getOr, map, pick, sortBy, uniqBy } = require('lodash/fp');
const contentApi = require('../services/content-api');
const routes = require('./routes');

const sortedUniqByPath = compose(sortBy('path'), uniqBy('path'));
const isLive = route => route.live === true;

/**
 * Build a flat list of all canonical routes
 * Combines application routes and routes defined by the CMS
 */
function getCanonicalRoutes({ includeDraft = false } = {}) {
    const routerCanonicalUrls = flatMap(section => {
        const withoutWildcards = filter(_ => _.path.indexOf('*') === -1);
        const mapSummary = map((page, key) => {
            return {
                title: key,
                path: section.path + page.path,
                live: page.live
            };
        });

        return compose(mapSummary, withoutWildcards)(section.pages);
    })(routes.sections);

    return contentApi.getRoutes().then(cmsCanonicalUrls => {
        const combined = concat(routerCanonicalUrls, cmsCanonicalUrls);
        const filtered = includeDraft === true ? combined : combined.filter(isLive);
        const sorted = sortedUniqByPath(filtered);
        return sorted;
    });
}

function getPageRedirects(sections) {
    const flatMapAliases = sectionPath => {
        return flatMap(page => {
            const getAliases = getOr([], 'aliases');
            return getAliases(page).map(urlPath => {
                return {
                    path: urlPath,
                    destination: sectionPath + page.path,
                    live: true
                };
            });
        });
    };

    const flatMapSections = flatMap(section => {
        return flatMapAliases(section.path)(section.pages);
    });

    return compact(flatMapSections(sections));
}

function getCustomRedirects(redirectsList) {
    const pickProps = pick(['path', 'destination', 'live']);
    const customRedirects = redirectsList.map(pickProps);
    return compact(customRedirects);
}

/**
 * Build a flat list of all all canonical redirects
 * Concatenate all legacy redirects + any page aliases
 */
function getCombinedRedirects({ includeDraft = false }) {
    const pageRedirects = getPageRedirects(routes.sections);
    const customRedirects = getCustomRedirects(routes.legacyRedirects);

    const combined = concat(customRedirects, pageRedirects);
    const filtered = includeDraft === true ? combined : combined.filter(isLive);
    const sorted = sortedUniqByPath(filtered);

    return Promise.resolve(sorted);
}

function getVanityRedirects() {
    const sorted = sortedUniqByPath(routes.vanityRedirects);
    return Promise.resolve(sorted);
}

module.exports = {
    getCanonicalRoutes,
    getCombinedRedirects,
    getVanityRedirects
};
