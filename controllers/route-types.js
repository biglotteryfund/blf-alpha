'use strict';
const config = require('config');

/**
 * Custom route
 * Route type with no defaults used
 * for routes with custom controllers
 */
function customRoute(props) {
    return props;
}

/**
 * Session route
 * Route type where session is required
 */
function sessionRoute(props) {
    const sessionDefaults = { isPostable: true, cookies: [config.get('cookies.session')] };
    return { ...sessionDefaults, ...props };
}

/**
 * Legacy route
 * Permissive defaults, POST and query-strings allowed
 * Used on proxied legacy pages, e.g. funding finder
 */
function legacyRoute(props) {
    const legacyDefaults = { isPostable: true, allowAllQueryStrings: true };
    return { ...legacyDefaults, ...props };
}

module.exports = {
    customRoute,
    sessionRoute,
    legacyRoute
};
