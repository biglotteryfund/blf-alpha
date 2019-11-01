'use strict';
const config = require('config');
const { assign, concat, flatMap, sortBy } = require('lodash');

const { makeWelsh, stripTrailingSlashes } = require('./urls');

/**
 * Make CloudFront behaviour item
 *
 * @param {object} options
 * @param {string} options.originId
 * @param {string} [options.pathPattern]
 * @param {boolean} [options.isPostable]
 * @param {Array<string>} [options.cookiesInUse]
 * @param {Array<string>} [options.queryStringWhitelist]
 * @param {boolean} [options.allowAllQueryStrings]
 * @param {Array<string>} [options.headersToKeep]
 */
function makeBehaviourItem({
    originId,
    pathPattern = null,
    isPostable = false,
    cookiesInUse = [],
    queryStringWhitelist = [],
    allowAllQueryStrings = false,
    headersToKeep = ['Accept', 'Host']
}) {
    const allowedHttpMethods = isPostable
        ? ['HEAD', 'DELETE', 'POST', 'GET', 'OPTIONS', 'PUT', 'PATCH']
        : ['HEAD', 'GET'];

    const globalQuerystrings = [
        'social',
        'token',
        'x-craft-live-preview',
        'x-craft-preview'
    ];
    const queryStrings = globalQuerystrings.concat(queryStringWhitelist);

    const behaviour = {
        TargetOriginId: originId,
        ViewerProtocolPolicy: 'redirect-to-https',
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

    if (cookiesInUse.length > 0) {
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
}

/**
 * Generate Cloudfront behaviours
 * construct array of behaviours from a URL list
 */
function generateBehaviours(origins) {
    const defaultCookies = [config.get('session.cookie'), 'standard-preview'];
    const cookiesWithoutSession = ['standard-preview'];

    const defaultBehaviour = makeBehaviourItem({
        originId: origins.site,
        isPostable: true,
        cookiesInUse: defaultCookies
    });

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
            headersToKeep: []
        })
    );

    /**
     * Custom cloudfront rules
     * If any cached url paths need custom cloudfront rules like query strings
     * or custom cookies to be whitelisted you must define those rules here.
     */
    const customPaths = [
        { path: '/api/*', isPostable: true, allowAllQueryStrings: true },
        {
            path: '/funding/grants*',
            isPostable: true,
            allowAllQueryStrings: true,
            isBilingual: true,
            noSession: true
        },
        {
            path: '/funding/programmes',
            queryStrings: ['location', 'amount', 'min', 'max'],
            isBilingual: true
        },
        {
            path: '/funding/programmes/all',
            queryStrings: ['location'],
            isBilingual: true
        },
        {
            path: '/news/*',
            queryStrings: ['page', 'tag', 'author', 'category', 'region'],
            isBilingual: true
        },
        {
            path: '/insights/documents*',
            queryStrings: [
                'page',
                'programme',
                'tag',
                'doctype',
                'portfolio',
                'q',
                'sort'
            ],
            isBilingual: true
        },
        { path: '/search', allowAllQueryStrings: true, isBilingual: true },
        {
            path: '/user/*',
            isPostable: true,
            queryStrings: ['redirectUrl', 's', 'token']
        }
    ];

    const primaryBehaviours = flatMap(customPaths, rule => {
        const cookiesForRule = rule.noSession
            ? cookiesWithoutSession
            : defaultCookies;

        const behaviour = makeBehaviourItem({
            originId: origins.site,
            pathPattern: rule.path,
            isPostable: rule.isPostable,
            queryStringWhitelist: rule.queryStrings,
            allowAllQueryStrings: rule.allowAllQueryStrings,
            cookiesInUse: cookiesForRule
        });

        if (rule.isBilingual) {
            const welshBehaviour = makeBehaviourItem({
                originId: origins.site,
                pathPattern: makeWelsh(rule.path),
                isPostable: rule.isPostable,
                queryStringWhitelist: rule.queryStrings,
                allowAllQueryStrings: rule.allowAllQueryStrings,
                cookiesInUse: cookiesForRule
            });

            return [behaviour, welshBehaviour];
        } else {
            return [behaviour];
        }
    });

    const combinedBehaviours = concat(primaryBehaviours, s3Behaviours);
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
