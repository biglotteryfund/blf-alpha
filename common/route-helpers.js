'use strict';

const {
    compose,
    concat,
    filter,
    flatMap,
    map,
    reject,
    sortBy,
    uniqBy
} = require('lodash/fp');

const contentApi = require('./content-api');
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
        const withoutWildcards = filter(page => page.path.indexOf('*') === -1);
        const withoutExcludes = reject(
            page => page.excludeFromSitemap === true
        );

        const mapSummary = map(page => {
            return {
                path: section.path + page.path,
                live: !page.isDraft
            };
        });

        return compose(
            mapSummary,
            withoutWildcards,
            withoutExcludes
        )(section.pages);
    })(routes.sections);

    const cmsCanonicalUrls = await contentApi.getRoutes();
    const combined = concat(routerCanonicalUrls, cmsCanonicalUrls);
    const filtered = combined.filter(route => route.live);
    return sortedUniqByPath(filtered);
}

module.exports = {
    getCanonicalRoutes
};
