'use strict';

const { get } = require('lodash');

/**
 * Create a top-level section
 *
 * path - top-level URL path, e.g. /funding
 * controllerPath - path to controller file
 * langTitlePath - locale property for translated page title
 */
function createSection({ path, controllerPath, langTitlePath }) {
    const newSection = {
        path: path,
        pages: null,
        langTitlePath: langTitlePath
    };

    /**
     * Controller loader function, allows us to auto-init routes
     */
    newSection.controller = function(pages, sectionPath, sectionId) {
        return require(controllerPath)(pages, sectionPath, sectionId);
    };

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
    live: false
};

/**
 * Basic route, typically used for custom routes
 * Restrictive by default, GET-only, no-query-strings
 */
function basicRoute(props) {
    return Object.assign(
        {},
        defaults,
        {
            live: true
        },
        props
    );
}

/**
 * Static route
 * Triggers static handler in 'routeCommon'
 * doesn't need a route handler, only a template path.
 */
function staticRoute(props) {
    const staticDefaults = {
        static: true,
        live: true
    };
    return Object.assign({}, defaults, staticDefaults, props);
}

/**
 * Dynamic route
 * Common route type with a dynamic route handler
 */
function dynamicRoute(props) {
    const dynamicDefaults = {
        static: false,
        live: true
    };
    return Object.assign({}, defaults, dynamicDefaults, props);
}

/**
 * Wildcard route
 * Extends from dynamic route, used when we require wildcard parameters
 * e.g. /some/route/:dynamicId
 * Used on the Free Materials form
 */
function wildcardRoute(props) {
    const wildcardDefaults = {
        static: false,
        live: true,
        isWildcard: true
    };
    return Object.assign({}, defaults, wildcardDefaults, props);
}

/**
 * CMS route
 * Triggers CMS content handler in 'routeCommon'
 * e.g. Programme detail pages
 */
function cmsRoute(props) {
    const cmsDefaults = {
        useCmsContent: true,
        live: true
    };
    return Object.assign({}, defaults, cmsDefaults, props);
}

/**
 * Legacy route
 * Permissive defaults, POST and query-strings allowed
 * Used on proxied legacy pages, e.g. funding finder
 */
function legacyRoute(props) {
    const legacyDefaults = {
        isPostable: true,
        allowAllQueryStrings: true,
        live: true
    };
    return Object.assign({}, legacyDefaults, props);
}

/**
 * Syntax sugar for archived routes,
 * quick basicRoute
 */
function archived(path) {
    return basicRoute({
        path
    });
}

/**
 * Alias for
 * Redirect helper accepting `to` and `from`
 * Allows aliases to be defined using a concise syntax
 */
function aliasFor(to, from, isLive = true) {
    return Object.assign({}, defaults, {
        path: from,
        destination: to,
        live: isLive
    });
}

/**
 * Vanity
 * Syntax sugar. Provides the aame functionality as
 * aliasFor() but with the `from` and `to` arguments swapped.
 * Allows vanity URLs to be defined using a concise syntax
 */
function vanity(from, to, isLive = true) {
    return Object.assign({}, defaults, {
        path: from,
        destination: to,
        live: isLive
    });
}

/**
 * Programme Migration
 * Handle redirects from /global-content/programmes to /funding/programmes
 * Same behaviour as vanity() but with prefilled url prefix.
 */
function programmeRedirect(from, to, isLive = true) {
    return Object.assign({}, defaults, {
        path: `/global-content/programmes/${from}`,
        destination: `/funding/programmes/${to}`,
        live: isLive
    });
}

module.exports = {
    createSection,
    basicRoute,
    staticRoute,
    dynamicRoute,
    wildcardRoute,
    cmsRoute,
    legacyRoute,
    archived,
    aliasFor,
    vanity,
    programmeRedirect
};
