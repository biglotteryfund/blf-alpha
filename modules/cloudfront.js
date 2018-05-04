'use strict';
const config = require('config');
const { assign, concat, filter, forEach, has, map, sortBy } = require('lodash');
const { makeWelsh, stripTrailingSlashes } = require('./urls');

/**
 * makeUrlObject
 * Apply defaults to route object
 */
function makeUrlObject(page, customPath) {
    return assign({}, page, {
        path: customPath || page.path,
        isPostable: page.isPostable || false,
        queryStrings: page.queryStrings || [],
        allowAllQueryStrings: page.allowAllQueryStrings || false
    });
}

function hasSpecialRequirements(route) {
    return route.allowAllQueryStrings || (route.queryStrings && route.queryStrings.length > 0) || has(route, 'abTest');
}

function isLive(route) {
    return route.live === true;
}

function pageNeedsCustomRouting(page) {
    return isLive(page) && hasSpecialRequirements(page);
}

// take the routes.js configuration and output locale-friendly URLs
// with support for POST, querystrings and redirects for Cloudfront
function generateUrlList(routes) {
    const urls = [];

    // add auto URLs from route config
    for (let s in routes.sections) {
        let section = routes.sections[s];
        let pages = section.pages;

        for (let p in pages) {
            let page = pages[p];
            let url = section.path + page.path;

            if (pageNeedsCustomRouting(page)) {
                if (page.isWildcard) {
                    url += '*';
                }
                // create route mapping for canonical URLs
                urls.push(makeUrlObject(page, url));
                urls.push(makeUrlObject(page, makeWelsh(url)));
            }
        }
    }

    function pushRouteConfig(routeConfig) {
        urls.push(makeUrlObject(routeConfig));
    }

    function pushDualRouteConfig(routeConfig) {
        urls.push(makeUrlObject(routeConfig));
        urls.push(makeUrlObject(routeConfig, makeWelsh(routeConfig.path)));
    }

    // Legacy proxied routes
    const liveLegacyRoutes = filter(routes.legacyProxiedRoutes, pageNeedsCustomRouting);
    forEach(liveLegacyRoutes, pushRouteConfig);

    // Legacy redirects
    routes.legacyRedirects.filter(pageNeedsCustomRouting).forEach(pushDualRouteConfig);

    // Archived routes
    routes.archivedRoutes.filter(pageNeedsCustomRouting).forEach(pushDualRouteConfig);

    // Vanity URLs
    routes.vanityRedirects.filter(pageNeedsCustomRouting).forEach(pushRouteConfig);

    // Other Routes
    routes.otherUrls.filter(pageNeedsCustomRouting).forEach(pushRouteConfig);

    return urls;
}

const makeBehaviourItem = ({
    originId,
    pathPattern,
    isPostable,
    cookiesInUse = [],
    allowAllCookies = false,
    queryStringWhitelist = [],
    allowAllQueryStrings = false,
    protocol = 'redirect-to-https',
    headersToKeep = ['Accept', 'Host']
}) => {
    const allowedHttpMethods = isPostable
        ? ['HEAD', 'DELETE', 'POST', 'GET', 'OPTIONS', 'PUT', 'PATCH']
        : ['HEAD', 'GET'];

    const globalQuerystrings = ['draft', 'version'];
    const queryStrings = globalQuerystrings.concat(queryStringWhitelist);

    const behaviour = {
        TargetOriginId: originId,
        ViewerProtocolPolicy: protocol,
        MinTTL: 0,
        MaxTTL: 31536000,
        DefaultTTL: 86400,
        Compress: true,
        SmoothStreaming: false,
        AllowedMethods: {
            Items: allowedHttpMethods,
            Quantity: allowedHttpMethods.length,
            CachedMethods: {
                Items: ['HEAD', 'GET'],
                Quantity: 2
            }
        },
        ForwardedValues: {
            Headers: {
                Items: headersToKeep,
                Quantity: headersToKeep.length
            },
            QueryStringCacheKeys: {
                Items: [],
                Quantity: 0
            },
            QueryString: false
        },
        TrustedSigners: {
            Enabled: false,
            Items: [],
            Quantity: 0
        },
        LambdaFunctionAssociations: {
            Items: [],
            Quantity: 0
        }
    };

    if (pathPattern) {
        behaviour.PathPattern = stripTrailingSlashes(pathPattern);
    }

    if (allowAllCookies) {
        behaviour.ForwardedValues.Cookies = {
            Forward: 'all'
        };
    } else if (cookiesInUse.length > 0) {
        behaviour.ForwardedValues.Cookies = {
            Forward: 'whitelist',
            WhitelistedNames: {
                Items: cookiesInUse,
                Quantity: cookiesInUse.length
            }
        };
    }

    if (allowAllQueryStrings) {
        behaviour.ForwardedValues = assign({}, behaviour.ForwardedValues, {
            QueryStringCacheKeys: {
                Items: [],
                Quantity: 0
            },
            QueryString: true
        });
    } else if (queryStrings.length > 0) {
        behaviour.ForwardedValues = assign({}, behaviour.ForwardedValues, {
            QueryStringCacheKeys: {
                Items: queryStrings,
                Quantity: queryStrings.length
            },
            QueryString: true
        });
    }

    return behaviour;
};

/**
 * Generate Cloudfront behaviours
 * construct array of behaviours from a URL list
 */
function generateBehaviours({ routesConfig, origins }) {
    const urlsToSupport = generateUrlList(routesConfig);

    const defaultCookies = [config.get('cookies.contrast')];

    const defaultBehaviour = makeBehaviourItem({
        originId: origins.newSite,
        isPostable: true,
        cookiesInUse: defaultCookies
    });

    // Serve legacy static files
    const customBehaviours = [
        '/-/*',
        '/js/*',
        '/css/*',
        '/images/*',
        '/default.css',
        '/PastGrants.ashx',
        '/news-and-events',
        '/funding/search-past-grants',
        '/funding/search-past-grants/*'
    ].map(path =>
        makeBehaviourItem({
            originId: origins.legacy,
            pathPattern: path,
            isPostable: true,
            allowAllQueryStrings: true,
            allowAllCookies: true,
            protocol: 'allow-all',
            headersToKeep: ['*']
        })
    );

    // direct all custom routes (eg. with non-standard config) to Express
    const primaryBehaviours = urlsToSupport.map(url => {
        const cookiesInUse = has(url, 'abTest.cookie') ? concat(defaultCookies, [url.abTest.cookie]) : defaultCookies;

        return makeBehaviourItem({
            originId: origins.newSite,
            pathPattern: url.path,
            isPostable: url.isPostable,
            queryStringWhitelist: url.queryStrings,
            allowAllQueryStrings: url.allowAllQueryStrings,
            cookiesInUse: cookiesInUse
        });
    });

    const combinedBehaviours = concat(customBehaviours, primaryBehaviours);
    const sortedBehaviours = sortBy(combinedBehaviours, 'PathPattern');

    return {
        DefaultCacheBehavior: defaultBehaviour,
        CacheBehaviors: {
            Items: sortedBehaviours,
            Quantity: sortedBehaviours.length
        }
    };
}

module.exports = {
    generateUrlList,
    makeBehaviourItem,
    generateBehaviours
};
