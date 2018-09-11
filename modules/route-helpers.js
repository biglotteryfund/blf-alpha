'use strict';

const { omitBy } = require('lodash/fp');
const { concat, flatMap, sortedUniq } = require('lodash');

const contentApi = require('../services/content-api');
const routes = require('../controllers/routes');

/**
 * Build a flat list of all canonical routes
 * Combines application routes and routes defined by the CMS
 */
async function getCanonicalRoutes() {
    const routerCanonicalUrls = flatMap(routes.sections, section => {
        return section.pages
            .filter(route => {
                // Remove wildcard and draft routes
                return route.path.indexOf('*') === -1 && !route.isDraft;
            })
            .map(route => section.path + route.path);
    });

    const cmsRoutes = await contentApi.getRoutes();
    const cmsCanonicalUrls = cmsRoutes.map(route => route.path);

    const combined = concat(routerCanonicalUrls, cmsCanonicalUrls);
    return sortedUniq(combined.sort());
}

function getSectionsForNavigation() {
    const inNav = omitBy(section => section.showInNavigation === false);
    return inNav(routes.sections);
}

module.exports = {
    getCanonicalRoutes,
    getSectionsForNavigation
};
