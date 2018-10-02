'use strict';

const { compose, concat, filter, flatMap, map, sortBy, uniqBy } = require('lodash/fp');

const contentApi = require('../services/content-api');
const routes = require('../controllers/routes');

const sortedUniqByPath = compose(
    sortBy('path'),
    uniqBy('path')
);

/**
 * Build a flat list of all canonical routes
 * Combines application routes and routes defined by the CMS
 */
async function getCanonicalRoutes() {
    const routerCanonicalUrls = flatMap(section => {
        const withoutWildcards = filter(_ => _.path.indexOf('*') === -1);
        const mapSummary = map((page, key) => {
            return {
                title: key,
                path: section.path + page.path
            };
        });

        return compose(
            mapSummary,
            withoutWildcards
        )(section.pages);
    })(routes.sections);

    const cmsCanonicalUrls = await contentApi.getRoutes();
    const combined = concat(routerCanonicalUrls, cmsCanonicalUrls);
    const filtered = combined.filter(route => !route.isDraft);
    return sortedUniqByPath(filtered);
}

module.exports = {
    getCanonicalRoutes
};
