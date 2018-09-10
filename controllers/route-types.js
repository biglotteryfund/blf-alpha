'use strict';
const config = require('config');

const CONTENT_TYPES = {
    STATIC: 'STATIC', // A page with no content from the cms and a static template
    CMS_BASIC: 'CMS_BASIC', // Page using the basic cms content type
    CMS_FLEXIBLE_CONTENT: 'CMS_FLEXIBLE_CONTENT' // Page using the cms flexible content type
};

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
 * Session route
 * Route type where session is required
 */
function sessionRoute(props) {
    const sessionDefaults = { isPostable: true, cookies: [config.get('cookies.session')] };
    return { ...defaults, ...sessionDefaults, ...props };
}

/**
 * Static route
 * Triggers static handler in 'controllers/common.js'
 */
function staticContentRoute(props) {
    const staticDefaults = { contentType: CONTENT_TYPES.STATIC };
    return { ...defaults, ...staticDefaults, ...props };
}

/**
 * Content API route
 * Triggers CMS basic content handler in 'controllers/common'
 */
function basicContentRoute(props) {
    const cmsDefaults = { contentType: CONTENT_TYPES.CMS_BASIC };
    return { ...defaults, ...cmsDefaults, ...props };
}

/**
 * Content API route
 * Triggers CMS flexible content handler in 'controllers/common'
 */
function flexibleContentRoute(props) {
    const cmsDefaults = { contentType: CONTENT_TYPES.CMS_FLEXIBLE_CONTENT };
    return { ...defaults, ...cmsDefaults, ...props };
}

module.exports = {
    CONTENT_TYPES,
    customRoute,
    sessionRoute,
    staticContentRoute,
    basicContentRoute,
    flexibleContentRoute
};
