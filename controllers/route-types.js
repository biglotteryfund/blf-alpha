'use strict';
const config = require('config');
const { get } = require('lodash');

/**
 * Create a top-level section
 *
 * path - top-level URL path, e.g. /funding
 * controllerPath - path to controller file
 * langTitlePath - locale property for translated page title
 */
function createSection({ path, controllerPath, langTitlePath, showInNavigation = true }) {
    const newSection = {
        path: path,
        pages: null,
        controller: null,
        langTitlePath: langTitlePath,
        showInNavigation: showInNavigation
    };

    /**
     * Controller loader function, allows us to auto-init routes
     */
    if (controllerPath) {
        newSection.controller = function(options) {
            return require(controllerPath)(options);
        };
    }

    /**
     * Setter for route pages
     */
    newSection.addRoutes = function(sectionRoutes) {
        newSection.pages = sectionRoutes;
    };

    /**
     * Find the cannonical path for a given page key
     */
    newSection.find = function(pageId) {
        const pagePath = get(newSection.pages, `${pageId}.path`);
        if (pagePath) {
            return `${path}${pagePath}`;
        } else {
            throw new Error(`No route found for ${pageId}`);
        }
    };

    return newSection;
}

/**
 * Default parameters for cloudfront routes
 * Restrictive by default
 */
const defaults = {
    isPostable: false,
    live: true
};

/**
 * Custom route
 * Route type with no defaults used
 * for routes with custom controllers
 */
function customRoute(props) {
    return { ...defaults, ...props };
}

/**
 * Static route
 * Triggers static handler in 'routeCommon'
 * doesn't need a route handler, only a template path.
 */
function staticRoute(props) {
    const staticDefaults = { static: true };
    return { ...defaults, ...staticDefaults, ...props };
}

/**
 * Session route
 * Route type where session is required
 */
function sessionRoute(props) {
    const sessionDefaults = { isPostable: true, cookies: [config.get('cookies.session')] };
    return { ...defaults, ...sessionDefaults, ...props };
}

/**
 * CMS route
 * Triggers CMS content handler in 'controllers/common'
 */
function cmsRoute(props) {
    const cmsDefaults = { useCmsContent: true };
    return { ...defaults, ...cmsDefaults, ...props };
}

/**
 * Legacy route
 * Permissive defaults, POST and query-strings allowed
 * Used on proxied legacy pages, e.g. funding finder
 */
function legacyRoute(props) {
    const legacyDefaults = { isPostable: true, allowAllQueryStrings: true };
    return { ...defaults, ...legacyDefaults, ...props };
}

module.exports = {
    createSection,
    staticRoute,
    customRoute,
    sessionRoute,
    cmsRoute,
    legacyRoute
};
