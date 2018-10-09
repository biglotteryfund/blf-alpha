/* eslint-env jest */
'use strict';

const {
    cleanLinkNoise,
    getBaseUrl,
    getCurrentUrl,
    hasTrailingSlash,
    isWelsh,
    localify,
    normaliseQuery,
    sanitiseUrlPath,
    stripTrailingSlashes
} = require('../urls');

const httpMocks = require('node-mocks-http');

describe('URL Helpers', () => {
    describe('#cleanLinkNoise', () => {
        it('should clean link noise from the URL', () => {
            expect(cleanLinkNoise('/funding/programmes/reaching-communities-england')).toBe(
                '/funding/programmes/reaching-communities-england'
            );

            expect(cleanLinkNoise('/~/link.aspx')).toBe('/');

            expect(cleanLinkNoise('/research/health-and-well-being/~/~/~/~/~/~/~/~/~/~/~/~/~/~/~/~/link.aspx')).toBe(
                '/research/health-and-well-being/'
            );

            expect(cleanLinkNoise('/welsh/england/funding/funding-guidance/applying-for-funding/~/link.aspx')).toBe(
                '/welsh/england/funding/funding-guidance/applying-for-funding/'
            );
        });
    });

    describe('#getCurrentUrl', () => {
        it('should return expected url for en locale', () => {
            const req = httpMocks.createRequest({
                method: 'GET',
                url: '/some/example/url/',
                headers: {
                    Host: 'biglotteryfund.org.uk',
                    'X-Forwarded-Proto': 'https'
                }
            });
            expect(getCurrentUrl(req, 'en')).toBe('/some/example/url');
            expect(getCurrentUrl(req, 'cy')).toBe('/welsh/some/example/url');
        });

        it('should correct url if in cy locale', () => {
            const req = httpMocks.createRequest({
                method: 'GET',
                url: '/welsh/some/example/url/',
                headers: {
                    Host: 'biglotteryfund.org.uk',
                    'X-Forwarded-Proto': 'https'
                }
            });

            expect(getCurrentUrl(req, 'en')).toBe('/some/example/url');
            expect(getCurrentUrl(req, 'cy')).toBe('/welsh/some/example/url');
        });

        it('should strip version and draft query parameters', () => {
            function withQuery(query) {
                return httpMocks.createRequest({
                    method: 'GET',
                    url: `/some/example/url?${query}`,
                    headers: {
                        Host: 'biglotteryfund.org.uk',
                        'X-Forwarded-Proto': 'https'
                    }
                });
            }
            expect(getCurrentUrl(withQuery('version=123'))).toBe('/some/example/url');
            expect(getCurrentUrl(withQuery('draft=123'))).toBe('/some/example/url');
            expect(getCurrentUrl(withQuery('version=123&something=else'))).toBe('/some/example/url?something=else');
            expect(getCurrentUrl(withQuery('draft=2&something=else'))).toBe('/some/example/url?something=else');
            expect(getCurrentUrl(withQuery('version=123&draft=2&something=else'))).toBe(
                '/some/example/url?something=else'
            );
        });
    });

    describe('#isWelsh', () => {
        it('should determine if a given url path is welsh', () => {
            expect(isWelsh('/welsh')).toBe(true);
            expect(isWelsh('/welsh/about')).toBe(true);
            expect(isWelsh('/about')).toBe(false);
            expect(isWelsh('/welsh/funding/funding-finder')).toBe(true);
            expect(isWelsh('/welsh/funding/programmes')).toBe(true);
            expect(isWelsh('/funding/programmes')).toBe(false);
        });

        it('should only be flagged as welsh url if starting with /welsh', () => {
            expect(isWelsh('/some/path/with/welsh')).toBe(false);
            expect(isWelsh('/funding/welsh/programmes')).toBe(false);
        });
    });

    describe('#localify', () => {
        it('should return correct url for a given locale', () => {
            expect(localify('en')('/funding/funding-finder')).toBe('/funding/funding-finder');

            expect(localify('cy')('/funding/funding-finder')).toBe('/welsh/funding/funding-finder');

            expect(localify('en')('/welsh/funding/funding-finder')).toBe('/funding/funding-finder');

            expect(localify('cy')('/welsh/funding/funding-finder')).toBe('/welsh/funding/funding-finder');
        });
    });

    describe('#getBaseUrl', () => {
        it('should return a base URL with protocol and host for a given request', () => {
            expect(
                getBaseUrl(
                    httpMocks.createRequest({
                        method: 'GET',
                        protocol: 'http',
                        headers: {
                            Host: 'example.org.uk'
                        }
                    })
                )
            ).toBe('http://example.org.uk');

            expect(
                getBaseUrl(
                    httpMocks.createRequest({
                        method: 'GET',
                        protocol: 'http',
                        headers: {
                            Host: 'example.org.uk',
                            'X-Forwarded-Proto': 'https'
                        }
                    })
                )
            ).toBe('https://example.org.uk');
        });
    });

    describe('#hasTrailingSlash', () => {
        it('should return boolean based on whether a urlPath has a trailing slash', () => {
            expect(hasTrailingSlash('/foo/')).toBe(true);
            expect(hasTrailingSlash('/welsh/')).toBe(true);
            expect(hasTrailingSlash('/path/to/longer/url/')).toBe(true);
            expect(hasTrailingSlash('/path/without/trailing/slash')).toBe(false);
        });

        it('should not consider homepage as having a trailing slash', () => {
            expect(hasTrailingSlash('/')).toBe(false);
        });
    });

    describe('#stripTrailingSlashes', () => {
        it('should strip trailing slashes correctly', () => {
            let pathWithSlash = '/foo/';
            let pathWithoutSlash = '/bar';
            let pathToHomepage = '/';
            expect(stripTrailingSlashes(pathWithSlash)).toBe('/foo');
            expect(stripTrailingSlashes(pathWithoutSlash)).toBe('/bar');
            expect(stripTrailingSlashes(pathToHomepage)).toBe('/');
        });
    });

    describe('#sanitiseUrlPath', () => {
        it('should sanitise url path', () => {
            expect(sanitiseUrlPath('/about/')).toBe('about');
            expect(sanitiseUrlPath('/welsh/path/to/something/')).toBe('path/to/something');
        });
    });

    describe('#normaliseQuery', () => {
        it('should normalise &amp; encoding in query strings', () => {
            expect(
                normaliseQuery({
                    area: 'England',
                    'amp;amount': '10001 - 50000',
                    'amp;org': 'Voluntary or community organisation',
                    'amp;sc': '1'
                })
            ).toEqual({
                area: 'England',
                amount: '10001 - 50000',
                org: 'Voluntary or community organisation',
                sc: '1'
            });
        });
    });
});
