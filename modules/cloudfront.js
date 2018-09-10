'use strict';
const config = require('config');
const { assign, compact, concat, flatten, flatMap, get, sortBy, uniq } = require('lodash');

const { makeWelsh, stripTrailingSlashes } = require('./urls');

const makeBehaviourItem = ({
    originId,
    pathPattern = null,
    isPostable = false,
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

    const globalQuerystrings = ['draft', 'version', 'enable-feature', 'disable-feature'];
    const queryStrings = globalQuerystrings.concat(queryStringWhitelist);

    const behaviour = {
        TargetOriginId: originId,
        ViewerProtocolPolicy: protocol,
        MinTTL: 0,
        MaxTTL: 31536000,
        DefaultTTL: 86400,
        FieldLevelEncryptionId: '',
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
function generateBehaviours({ cloudfrontRules, origins }) {
    const urlsToSupport = flatMap(cloudfrontRules, routeConfig => {
        if (routeConfig.isBilingual) {
            const welshRouteConfig = assign({}, routeConfig, {
                path: makeWelsh(routeConfig.path)
            });

            return [routeConfig, welshRouteConfig];
        } else {
            return routeConfig;
        }
    });

    const defaultCookies = [
        config.get('cookies.contrast'),
        config.get('cookies.features'),
        config.get('cookies.session')
    ];

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
        const cookiesInUse = uniq(
            compact(
                flatten([
                    // Global cookies
                    defaultCookies,
                    // Route specific a/b test cookie
                    get(url, 'abTest.cookie'),
                    // Custom route specific cookies
                    get(url, 'cookies', [])
                ])
            )
        );

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
    makeBehaviourItem,
    generateBehaviours
};
