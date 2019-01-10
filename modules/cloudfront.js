'use strict';
const cookies = require('config').get('cookies');
const { assign, compact, concat, flatten, flatMap, get, sortBy, uniq, findIndex } = require('lodash');

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
    } else {
        behaviour.ForwardedValues.Cookies = {
            Forward: 'none'
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
function generateBehaviours(origins, originName) {
    const defaultBehaviour = makeBehaviourItem({
        originId: origins.newSite,
        isPostable: true,
        cookiesInUse: [cookies.contrast, cookies.features, cookies.rebrand, cookies.session]
    });

    /**
     * Legacy route paths
     * Paths in this list will be routed
     * directly to the legacy site origin
     */
    const customBehaviours = [
        '/-/*',
        '/js/*',
        '/css/*',
        '/images/*',
        '/default.css',
        '/PastGrants.ashx',
        '/news-and-events'
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

    // Add the legacy file path to the start of the list
    // so it isn't overridden by the more general one
    customBehaviours.unshift(
        makeBehaviourItem({
            originId: origins.newSite,
            pathPattern: '/-/media/files/*',
            isPostable: false,
            allowAllQueryStrings: true,
            allowAllCookies: true,
            protocol: 'allow-all',
            headersToKeep: ['*']
        })
    );

    /**
     * S3 static file route paths
     * Paths in this list will be routed to an S3 bucket
     * either for CMS uploads or app-generated static files.
     * NOTE: they should _not_ start with leading slashes
     * otherwise they fail to match directory names in S3.
     */
    const s3Behaviours = ['assets/*', 'media/*'].map(path =>
        makeBehaviourItem({
            originId: origins.s3Assets,
            pathPattern: path,
            allowAllCookies: false,
            headersToKeep: []
        })
    );

    /**
     * Custom cloudfront rules
     * If any cached url paths need custom cloudfront rules like query strings
     * or custom cookies to be whitelisted you must define those rules here.
     */
    let customPaths = [
        { path: '*~/link.aspx', isPostable: true, allowAllQueryStrings: true },
        { path: '/api/*', isPostable: true, allowAllQueryStrings: true },
        { path: '/funding/funding-finder', isPostable: true, allowAllQueryStrings: true, isBilingual: true },
        { path: '/funding/grants*', isPostable: true, allowAllQueryStrings: true, isBilingual: true, noSession: true },
        { path: '/funding/programmes', queryStrings: ['location', 'amount', 'min', 'max'], isBilingual: true },
        { path: '/funding/programmes/all', queryStrings: ['location'], isBilingual: true },
        { path: '/news/*', queryStrings: ['page', 'tag', 'author', 'category', 'region'], isBilingual: true },
        { path: '/search', allowAllQueryStrings: true, isBilingual: true },
        { path: '/user/*', isPostable: true, queryStrings: ['redirectUrl', 's', 'token'] }
    ];

    const primaryBehaviours = flatMap(customPaths, rule => {
        // Merge default cookies with rule specific cookie
        const cookiesInUse = uniq(
            compact(
                flatten([
                    [
                        cookies.contrast,
                        cookies.features,
                        cookies.rebrand,
                        rule.noSession === true ? null : cookies.session
                    ],
                    get(rule, 'cookies', [])
                ])
            )
        );

        const behaviour = makeBehaviourItem({
            originId: origins.newSite,
            pathPattern: rule.path,
            isPostable: rule.isPostable,
            queryStringWhitelist: rule.queryStrings,
            allowAllQueryStrings: rule.allowAllQueryStrings,
            cookiesInUse: cookiesInUse
        });

        if (rule.isBilingual) {
            const welshBehaviour = makeBehaviourItem({
                originId: origins.newSite,
                pathPattern: makeWelsh(rule.path),
                isPostable: rule.isPostable,
                queryStringWhitelist: rule.queryStrings,
                allowAllQueryStrings: rule.allowAllQueryStrings,
                cookiesInUse: cookiesInUse
            });

            return [behaviour, welshBehaviour];
        } else {
            return [behaviour];
        }
    });

    const combinedBehaviours = concat(customBehaviours, primaryBehaviours, s3Behaviours);
    let sortedBehaviours = sortBy(combinedBehaviours, 'PathPattern');

    // Temporary workaround: manually reorder legacy rules to avoid precedence error
    // @TODO remove this post-rebrand once we stop sending traffic to legacy origins
    const legacyFilePathIndex = findIndex(sortedBehaviours, b => b.PathPattern === '/-/media/files/*');
    const legacyFilePathWildcardIndex = findIndex(sortedBehaviours, b => b.PathPattern === '/-/*');
    const tempBehaviourItem = sortedBehaviours[legacyFilePathIndex];
    sortedBehaviours[legacyFilePathIndex] = sortedBehaviours[legacyFilePathWildcardIndex];
    sortedBehaviours[legacyFilePathWildcardIndex] = tempBehaviourItem;

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
