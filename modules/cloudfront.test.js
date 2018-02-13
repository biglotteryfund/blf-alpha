'use strict';
/* global describe, it */
const chai = require('chai');
const expect = chai.expect;

const { generateUrlList, makeBehaviourItem } = require('./cloudfront');

describe('Cloudfront Helpers', () => {
    describe('#makeBehaviourItem', () => {
        it('should return cloudfront behaviour for route', () => {
            const behaviour = makeBehaviourItem({
                origin: 'newSite',
                originServer: 'BLF_EXAMPLE',
                pathPattern: '/',
                isPostable: false,
                cookiesInUse: ['example']
            });

            expect(behaviour).to.eql({
                TrustedSigners: {
                    Enabled: false,
                    Items: [],
                    Quantity: 0
                },
                LambdaFunctionAssociations: {
                    Items: [],
                    Quantity: 0
                },
                TargetOriginId: 'BLF_EXAMPLE',
                ViewerProtocolPolicy: 'redirect-to-https',
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
                    QueryStringCacheKeys: {
                        Items: [],
                        Quantity: 0
                    },
                    QueryString: false
                },
                MaxTTL: 31536000,
                PathPattern: '/',
                SmoothStreaming: false,
                DefaultTTL: 86400,
                AllowedMethods: {
                    Items: ['HEAD', 'GET'],
                    CachedMethods: {
                        Items: ['HEAD', 'GET'],
                        Quantity: 2
                    },
                    Quantity: 2
                },
                MinTTL: 0,
                Compress: false
            });
        });

        it('should allow a query string whitelist', () => {
            const behaviour = makeBehaviourItem({
                origin: 'newSite',
                originServer: 'BLF_EXAMPLE',
                pathPattern: '/',
                isPostable: true,
                queryStringWhitelist: ['a', 'b', 'c'],
                cookiesInUse: ['example']
            });

            expect(behaviour).to.eql({
                TrustedSigners: {
                    Enabled: false,
                    Items: [],
                    Quantity: 0
                },
                LambdaFunctionAssociations: {
                    Items: [],
                    Quantity: 0
                },
                TargetOriginId: 'BLF_EXAMPLE',
                ViewerProtocolPolicy: 'redirect-to-https',
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
                    QueryStringCacheKeys: {
                        Items: ['a', 'b', 'c'],
                        Quantity: 3
                    },
                    QueryString: true
                },
                MaxTTL: 31536000,
                PathPattern: '/',
                SmoothStreaming: false,
                DefaultTTL: 86400,
                AllowedMethods: {
                    Items: ['HEAD', 'DELETE', 'POST', 'GET', 'OPTIONS', 'PUT', 'PATCH'],
                    CachedMethods: {
                        Items: ['HEAD', 'GET'],
                        Quantity: 2
                    },
                    Quantity: 7
                },
                MinTTL: 0,
                Compress: false
            });
        });
    });

    describe('#generateUrlList', () => {
        const testRoutes = {
            sections: {
                purple: {
                    path: '/purple',
                    pages: {
                        monkey: {
                            path: '/monkey/dishwasher',
                            live: true,
                            isWildcard: false,
                            isPostable: false,
                            aliases: ['/green/orangutan/fridge']
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
            ],
            legacyRedirects: [
                {
                    path: '/global-content/programmes/example',
                    destination: '/funding/programmes/example',
                    isPostable: false,
                    live: true
                }
            ],
            vanityRedirects: [
                {
                    path: '/test',
                    live: true
                }
            ]
        };

        it('should filter out non-live routes', done => {
            let urlList = generateUrlList(testRoutes);
            expect(urlList.newSite.length).to.equal(10);
            done();
        });

        it('should generate the correct section/page path', done => {
            let urlList = generateUrlList(testRoutes);
            expect(urlList.newSite.filter(r => r.path === '/purple/monkey/dishwasher').length).to.equal(1);
            done();
        });

        it('should generate welsh versions of canonical routes', done => {
            let urlList = generateUrlList(testRoutes);
            expect(urlList.newSite.filter(r => r.path === '/welsh/purple/monkey/dishwasher').length).to.equal(1);
            done();
        });

        it('should store properties against routes', done => {
            let urlList = generateUrlList(testRoutes);
            expect(urlList.newSite.filter(r => r.path === '/unicorns')[0].isPostable).to.equal(true);
            done();
        });
    });
});
