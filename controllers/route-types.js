'use strict';
const config = require('config');
const { get, isArray } = require('lodash');

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
 * Dynamic route
 * Common route type with a dynamic route handler
 */
function dynamicRoute(props) {
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
    const sessionDefaults = { cookies: [config.get('cookies.session')] };
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

/**
 * Syntax sugar for archived routes
 */
function archived(path) {
    return dynamicRoute({ path });
}

function alias(to, from, isLive = true) {
    return dynamicRoute({
        path: from,
        destination: to,
        live: isLive
    });
}

/**
 * Alias for
 * Redirect helper accepting `to` and `from`
 * Allows aliases to be defined using a concise syntax
 */
function aliasFor(to, from, isLive = true) {
    if (isArray(from)) {
        return from.map(fromPath => alias(to, fromPath, isLive));
    } else {
        return alias(to, from, isLive);
    }
}

/**
 * Programme Migration
 * Handle redirects from /global-content/programmes to /funding/programmes
 */
function programmeRedirect(from, to, isLive = true) {
    return dynamicRoute({
        path: `/global-content/programmes/${from}`,
        destination: `/funding/programmes/${to}`,
        live: isLive
    });
}

module.exports = {
    createSection,
    staticRoute,
    dynamicRoute,
    sessionRoute,
    cmsRoute,
    legacyRoute,
    archived,
    aliasFor,
    programmeRedirect
};
