'use strict';

const { compose, concat, filter, flatMap, map, sortBy, uniqBy } = require('lodash/fp');

const contentApi = require('./content-api');
const routes = require('../controllers/routes');

const sortedUniqByPath = compose(
    sortBy('path'),
    uniqBy('path')
);

const isLive = route => route.live === true;

/**
 * Build a flat list of all canonical routes
 * Combines application routes and routes defined by the CMS
 */
async function getCanonicalRoutes({ locale, includeDraft = false } = {}) {
    const routerCanonicalUrls = flatMap(section => {
        const withoutWildcards = filter(_ => _.path.indexOf('*') === -1);
        const mapSummary = map(page => {
            return {
                langTitlePath: page.langTitlePath || page.lang ? page.lang + '.title' : null,
                path: (section.path + page.path).replace(/\/$/, ''),
                live: page.live
            };
        });

        return compose(
            mapSummary,
            withoutWildcards
        )(section.pages);
    })(routes.sections);

    const cmsCanonicalUrls = await contentApi.getRoutes(locale);
    const combined = concat(cmsCanonicalUrls, routerCanonicalUrls);
    const filtered = includeDraft === true ? combined : combined.filter(isLive);
    return sortedUniqByPath(filtered);
}

module.exports = {
    getCanonicalRoutes
};
