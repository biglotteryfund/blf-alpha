/* eslint-env jest */
'use strict';

const { defaultsDeep } = require('lodash');
const { generateUrlList, makeBehaviourItem } = require('../cloudfront');

describe('Cloudfront Helpers', () => {
    const testRoutes = {
        sections: {
            purple: {
                path: '/purple',
                pages: {
                    monkey: {
                        path: '/monkey/dishwasher',
                        live: true,
                        isPostable: true,
                        aliases: ['/green/orangutan/fridge'],
                        queryStrings: ['foo', 'bar']
                    }
                }
            }
        },
        archivedRoutes: [
            {
                path: '/some/archived/path/*',
                live: true
            }
        ],
        otherUrls: [
            {
                path: '/unicorns',
                isPostable: true,
                live: true
            },
            {
                path: '/draft',
                live: false
            }
        ]
    };

    describe('#generateUrlList', () => {
        it('should filter out non-custom routes', done => {
            const urls = generateUrlList(testRoutes);
            expect(urls.length).toBe(2);
            done();
        });

        it('should generate the correct section/page path', done => {
            const urls = generateUrlList(testRoutes);
            expect(urls.filter(r => r.path === '/purple/monkey/dishwasher').length).toBe(1);
            done();
        });

        it('should generate welsh versions of canonical routes', done => {
            const urls = generateUrlList(testRoutes);
            expect(urls.filter(r => r.path === '/welsh/purple/monkey/dishwasher').length).toBe(1);
            done();
        });

        it('should store properties against routes', done => {
            const urls = generateUrlList(testRoutes);
            expect(urls.filter(r => r.path === '/purple/monkey/dishwasher')[0].isPostable).toBe(true);
            done();
        });
    });

    describe('#makeBehaviourItem', () => {
        function withDefaults(behaviourConfig) {
            return defaultsDeep(behaviourConfig, {
                MinTTL: 0,
                MaxTTL: 31536000,
                DefaultTTL: 86400,
                FieldLevelEncryptionId: '',
                SmoothStreaming: false,
                Compress: true,
                AllowedMethods: {
                    Items: ['HEAD', 'GET'],
                    Quantity: 2,
                    CachedMethods: {
                        Items: ['HEAD', 'GET'],
                        Quantity: 2
                    }
                },
                ForwardedValues: {
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
            });
        }

        it('should return cloudfront behaviour for route', () => {
            const behaviour = makeBehaviourItem({
                originId: 'BLF_EXAMPLE',
                pathPattern: '/',
                isPostable: false,
                cookiesInUse: ['example']
            });

            expect(behaviour).toEqual(
                withDefaults({
                    TargetOriginId: 'BLF_EXAMPLE',
                    ViewerProtocolPolicy: 'redirect-to-https',
                    PathPattern: '/',
                    ForwardedValues: {
                        Headers: {
                            Items: ['Accept', 'Host'],
                            Quantity: 2
                        },
                        Cookies: {
                            Forward: 'whitelist',
                            WhitelistedNames: {
                                Items: ['example'],
                                Quantity: 1
                            }
                        },
                        QueryString: true,
                        QueryStringCacheKeys: {
                            Items: ['draft', 'version', 'enable-feature', 'disable-feature'],
                            Quantity: 4
                        }
                    }
                })
            );
        });

        it('should allow all cookies and querystrings', () => {
            const behaviour = makeBehaviourItem({
                originId: 'BLF_LEGACY_EXAMPLE',
                pathPattern: '/~/*',
                isPostable: true,
                allowAllQueryStrings: true,
                allowAllCookies: true,
                protocol: 'allow-all',
                headersToKeep: ['*']
            });

            expect(behaviour).toEqual(
                withDefaults({
                    TargetOriginId: 'BLF_LEGACY_EXAMPLE',
                    ViewerProtocolPolicy: 'allow-all',
                    PathPattern: '/~/*',
                    AllowedMethods: {
                        Items: ['HEAD', 'DELETE', 'POST', 'GET', 'OPTIONS', 'PUT', 'PATCH'],
                        Quantity: 7
                    },
                    ForwardedValues: {
                        Headers: {
                            Items: ['*'],
                            Quantity: 1
                        },
                        Cookies: {
                            Forward: 'all'
                        },
                        QueryStringCacheKeys: {
                            Items: [],
                            Quantity: 0
                        },
                        QueryString: true
                    }
                })
            );
        });
    });
});
