'use strict';

/**
 * Create a top-level section
 *
 * path - top-level URL path, e.g. /funding
 * controllerPath - path to controller file
 * langTitlePath - locale property for translated page title
 */
function createSection({ path, controllerPath, langTitlePath }) {
    return {
        path,
        controller: function(pages, sectionPath, sectionId) {
            return require(controllerPath)(pages, sectionPath, sectionId);
        },
        langTitlePath,
        pages: null
    };
}

/**
 * Default parameters for cloudfront routes
 * Restrictive by default, GET-only, no-query-strings
 */
const defaults = {
    isPostable: false,
    allowQueryStrings: false,
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
 * Triggers 'routeStatic' behaviour, doesn't need
 * a custom route handler, only a template path.
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
 * Triggers 'routeStatic' behaviour, and fetches content dynamically from CMS
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
        allowQueryStrings: true,
        live: true
    };
    return Object.assign({}, legacyDefaults, props);
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
    aliasFor,
    vanity,
    programmeRedirect
};
