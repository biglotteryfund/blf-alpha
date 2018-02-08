const { assign, filter, forEach } = require('lodash');
const { makeWelsh, stripTrailingSlashes } = require('./urls');

// create a JSON object configured for the legacy/new paths
const makeBehaviourItem = ({
    origin,
    originServer,
    pathPattern,
    isPostable,
    allowQueryStrings,
    queryStringWhitelist,
    cookiesInUse
}) => {
    // configure headers, cookies and origin servers for paths
    const BehaviourConfig = {
        protocols: {
            redirectToHttps: 'redirect-to-https',
            allowAll: 'allow-all'
        },
        httpMethods: {
            getOnly: ['HEAD', 'GET'],
            getAndPost: ['HEAD', 'DELETE', 'POST', 'GET', 'OPTIONS', 'PUT', 'PATCH']
        },
        TTLs: {
            min: 0,
            max: 31536000,
            default: 86400
        },
        newSite: {
            headersToKeep: ['Accept', 'Host'],
            cookies: {
                Forward: 'whitelist',
                WhitelistedNames: {
                    Items: cookiesInUse,
                    Quantity: cookiesInUse.length
                }
            }
        },
        legacy: {
            headersToKeep: ['*'],
            cookies: {
                Forward: 'all'
            }
        }
    };

    // The new site is properly cached, the legacy is not
    // so anything legacy should not cache cookies, headers, etc
    const isLegacy = origin !== 'newSite';
    const cacheConfig = isLegacy ? BehaviourConfig['legacy'] : BehaviourConfig['newSite'];

    // Strip trailing slashes
    // fixes /welsh => /welsh/ homepage confusion
    // but doesn't break root/homepage '/' path
    const cleanPathPattern = stripTrailingSlashes(pathPattern);

    // Use all HTTP methods for legacy
    const allowedHttpMethods =
        isLegacy || isPostable ? BehaviourConfig.httpMethods.getAndPost : BehaviourConfig.httpMethods.getOnly;

    // Allow any protocol for legacy, redirect to HTTPS for new
    const protocol = isLegacy ? BehaviourConfig.protocols.allowAll : BehaviourConfig.protocols.redirectToHttps;

    const behaviour = {
        TrustedSigners: {
            Enabled: false,
            Items: [],
            Quantity: 0
        },
        LambdaFunctionAssociations: {
            Items: [],
            Quantity: 0
        },
        TargetOriginId: originServer,
        ViewerProtocolPolicy: protocol,
        ForwardedValues: {
            Headers: {
                Items: cacheConfig.headersToKeep,
                Quantity: cacheConfig.headersToKeep.length
            },
            Cookies: cacheConfig.cookies,
            QueryStringCacheKeys: {
                Items: [],
                Quantity: 0
            },
            QueryString: false
        },
        MaxTTL: BehaviourConfig.TTLs.max,
        PathPattern: cleanPathPattern,
        SmoothStreaming: false,
        DefaultTTL: BehaviourConfig.TTLs.default,
        AllowedMethods: {
            Items: allowedHttpMethods,
            CachedMethods: {
                Items: ['HEAD', 'GET'],
                Quantity: 2
            },
            Quantity: allowedHttpMethods.length
        },
        MinTTL: BehaviourConfig.TTLs.min,
        Compress: false
    };

    const shouldAllowQueryStrings = isLegacy || allowQueryStrings;
    if (shouldAllowQueryStrings) {
        const whitelist = queryStringWhitelist || [];
        behaviour.ForwardedValues = assign({}, behaviour.ForwardedValues, {
            QueryStringCacheKeys: {
                Items: whitelist,
                Quantity: whitelist.length
            },
            QueryString: true
        });
    }

    return behaviour;
};

/**
 * makeUrlObject
 * Take a route config and format it for cloudfront
 */
function makeUrlObject(page, customPath) {
    return {
        path: customPath || page.path,
        isPostable: page.isPostable || false,
        allowQueryStrings: page.allowQueryStrings || false,
        queryStringWhitelist: page.queryStringWhitelist || []
    };
}

function isLive(route) {
    return route.live === true;
}

// take the routes.js configuration and output locale-friendly URLs
// with support for POST, querystrings and redirects for Cloudfront
function generateUrlList(routes) {
    // keys here are mapped to origin servers in the Cloudfront distribution config
    let urlList = {
        // if anything is added here, the TEST Cloudfront distribution
        // will fail to update as it doesn't have a legacy origin.
        legacy: [],
        newSite: []
    };

    // add auto URLs from route config
    for (let s in routes.sections) {
        let section = routes.sections[s];
        let pages = section.pages;

        for (let p in pages) {
            let page = pages[p];
            let url = section.path + page.path;
            if (page.live) {
                if (page.isWildcard) {
                    url += '*';
                }
                // create route mapping for canonical URLs
                urlList.newSite.push(makeUrlObject(page, url));
                urlList.newSite.push(makeUrlObject(page, makeWelsh(url)));

                // add redirects for aliases
                if (page.aliases) {
                    page.aliases.forEach(alias => {
                        const pageObject = { path: alias };
                        urlList.newSite.push(makeUrlObject(pageObject));
                        urlList.newSite.push(makeUrlObject(pageObject, makeWelsh(alias)));
                    });
                }
            } else {
                console.log(`Skipping URL because it's marked as draft: ${url}`);
            }
        }
    }

    /**
     * Legacy proxied routes
     */
    const liveLegacyRoutes = filter(routes.legacyProxiedRoutes, isLive);
    forEach(liveLegacyRoutes, routeConfig => {
        urlList.newSite.push(makeUrlObject(routeConfig));
    });

    /**
     * Legacy Redirects
     */
    routes.legacyRedirects.filter(isLive).forEach(routeConfig => {
        const pageObject = { path: routeConfig.path };
        urlList.newSite.push(makeUrlObject(pageObject));
        urlList.newSite.push(makeUrlObject(pageObject, makeWelsh(pageObject.path)));
    });

    /**
     * Archived Routes
     */
    routes.archivedRoutes.filter(isLive).forEach(routeConfig => {
        const pageObject = { path: routeConfig.path };
        urlList.newSite.push(makeUrlObject(pageObject));
        urlList.newSite.push(makeUrlObject(pageObject, makeWelsh(pageObject.path)));
    });

    /**
     * Vanity URLs
     */
    routes.vanityRedirects.filter(isLive).forEach(redirect => {
        const pageObject = { path: redirect.path };
        urlList.newSite.push(makeUrlObject(pageObject));
    });

    /**
     * Other Routes
     */
    routes.otherUrls.filter(isLive).forEach(routeConfig => {
        urlList.newSite.push(makeUrlObject(routeConfig));
    });

    return urlList;
}

module.exports = {
    makeBehaviourItem,
    generateUrlList
};
