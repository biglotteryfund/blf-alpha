'use strict';

const { compose, concat, filter, flatMap, map, omitBy, sortBy, uniqBy } = require('lodash/fp');

const contentApi = require('../../services/content-api');
const routes = require('../routes');

const sortedUniqByPath = compose(sortBy('path'), uniqBy('path'));
const isLive = route => route.live === true;

/**
 * Build a flat list of all canonical routes
 * Combines application routes and routes defined by the CMS
 */
async function getCanonicalRoutes({ includeDraft = false } = {}) {
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

    const cmsCanonicalUrls = await contentApi.getRoutes();
    const combined = concat(routerCanonicalUrls, cmsCanonicalUrls);
    const filtered = includeDraft === true ? combined : combined.filter(isLive);
    const sorted = sortedUniqByPath(filtered);
    return sorted;
}

function getSectionsForNavigation() {
    const inNav = omitBy(section => section.showInNavigation === false);
    return inNav(routes.sections);
}

module.exports = {
    getCanonicalRoutes,
    getSectionsForNavigation
};
