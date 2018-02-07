'use strict';

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

const defaults = {
    isPostable: false,
    allowQueryStrings: false,
    live: false
};

function withDefaults(props) {
    return Object.assign({}, defaults, props);
}

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

function staticRoute(props) {
    const staticDefaults = {
        static: true,
        live: true
    };
    return Object.assign({}, defaults, staticDefaults, props);
}

function dynamicRoute(props) {
    const dynamicDefaults = {
        static: false,
        live: true
    };
    return Object.assign({}, defaults, dynamicDefaults, props);
}

function cmsRoute(props) {
    const cmsDefaults = {
        useCmsContent: true,
        live: true
    };
    return Object.assign({}, defaults, cmsDefaults, props);
}

function legacyRoute(props) {
    const legacyDefaults = {
        isPostable: true,
        allowQueryStrings: true,
        live: true
    };
    return Object.assign({}, legacyDefaults, props);
}

function vanity(urlPath, destination, isLive = false) {
    return withDefaults({
        path: urlPath,
        destination: destination,
        live: isLive
    });
}

/**
 * Programme Migration
 * Handle redirects from /global-content/programmes to /funding/programmes
 */
function programmeMigration(from, to, isLive) {
    return {
        path: `/global-content/programmes/${from}`,
        destination: `/funding/programmes/${to}`,
        isPostable: false,
        allowQueryStrings: false,
        live: !isLive ? false : true
    };
}

module.exports = {
    createSection,
    withDefaults,
    basicRoute,
    staticRoute,
    dynamicRoute,
    cmsRoute,
    legacyRoute,
    vanity,
    programmeMigration
};
