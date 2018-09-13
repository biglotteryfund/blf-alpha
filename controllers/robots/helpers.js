'use strict';

const { concat, flatMap, sortedUniq } = require('lodash');

const contentApi = require('../../services/content-api');
const sections = require('../../controllers/sections');

/**
 * Build a flat list of all canonical routes
 * Combines application routes and routes defined by the CMS
 */
async function getCanonicalRoutes() {
    const routerCanonicalUrls = flatMap(sections, section => {
        // Remove wildcard and draft routes
        return section.routes
            .filter(route => {
                return route.path.indexOf('*') === -1 && !route.isDraft;
            })
            .map(route => section.path + route.path);
    });

    const cmsRoutes = await contentApi.getRoutes();
    const cmsCanonicalUrls = cmsRoutes.map(route => route.path);

    const combined = concat(routerCanonicalUrls, cmsCanonicalUrls);
    return sortedUniq(combined.sort());
}

module.exports = {
    getCanonicalRoutes
};
