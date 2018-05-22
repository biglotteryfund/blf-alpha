'use strict';
/* global describe, it */
const chai = require('chai');
const expect = chai.expect;

const {
    getBaseUrl,
    getCurrentUrl,
    hasTrailingSlash,
    isWelsh,
    localify,
    normaliseQuery,
    sanitiseUrlPath,
    stripTrailingSlashes
} = require('./urls');

const httpMocks = require('node-mocks-http');

describe('URL Helpers', () => {
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
            expect(getCurrentUrl(req, 'en')).to.equal('/some/example/url');
            expect(getCurrentUrl(req, 'cy')).to.equal('/welsh/some/example/url');
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

            expect(getCurrentUrl(req, 'en')).to.equal('/some/example/url');
            expect(getCurrentUrl(req, 'cy')).to.equal('/welsh/some/example/url');
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
            expect(getCurrentUrl(withQuery('version=123'))).to.equal('/some/example/url');
            expect(getCurrentUrl(withQuery('draft=123'))).to.equal('/some/example/url');
            expect(getCurrentUrl(withQuery('version=123&something=else'))).to.equal('/some/example/url?something=else');
            expect(getCurrentUrl(withQuery('draft=2&something=else'))).to.equal('/some/example/url?something=else');
            expect(getCurrentUrl(withQuery('version=123&draft=2&something=else'))).to.equal(
                '/some/example/url?something=else'
            );
        });
    });

    describe('#isWelsh', () => {
        it('should determine if a given url path is welsh', () => {
            expect(isWelsh('/welsh')).to.be.true;
            expect(isWelsh('/welsh/about')).to.be.true;
            expect(isWelsh('/about')).to.be.false;
            expect(isWelsh('/welsh/funding/funding-finder')).to.be.true;
            expect(isWelsh('/welsh/funding/programmes')).to.be.true;
            expect(isWelsh('/funding/programmes')).to.be.false;
        });

        it('should only be flagged as welsh url if starting with /welsh', () => {
            expect(isWelsh('/some/path/with/welsh')).to.be.false;
            expect(isWelsh('/funding/welsh/programmes')).to.be.false;
        });
    });

    describe('#localify', () => {
        it('should return correct url for a given locale', () => {
            expect(localify('en')('/funding/funding-finder')).to.equal('/funding/funding-finder');

            expect(localify('cy')('/funding/funding-finder')).to.equal('/welsh/funding/funding-finder');

            expect(localify('en')('/welsh/funding/funding-finder')).to.equal('/funding/funding-finder');

            expect(localify('cy')('/welsh/funding/funding-finder')).to.equal('/welsh/funding/funding-finder');
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
            ).to.equal('http://example.org.uk');

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
            ).to.equal('https://example.org.uk');
        });
    });

    describe('#hasTrailingSlash', () => {
        it('should return boolean based on whether a urlPath has a trailing slash', () => {
            expect(hasTrailingSlash('/foo/')).to.be.true;
            expect(hasTrailingSlash('/welsh/')).to.be.true;
            expect(hasTrailingSlash('/path/to/longer/url/')).to.be.true;
            expect(hasTrailingSlash('/path/without/trailing/slash')).to.be.false;
        });

        it('should not consider homepage as having a trailing slash', () => {
            expect(hasTrailingSlash('/')).to.be.false;
        });
    });

    describe('#stripTrailingSlashes', () => {
        it('should strip trailing slashes correctly', () => {
            let pathWithSlash = '/foo/';
            let pathWithoutSlash = '/bar';
            let pathToHomepage = '/';
            expect(stripTrailingSlashes(pathWithSlash)).to.equal('/foo');
            expect(stripTrailingSlashes(pathWithoutSlash)).to.equal('/bar');
            expect(stripTrailingSlashes(pathToHomepage)).to.equal('/');
        });
    });

    describe('#sanitiseUrlPath', () => {
        it('should sanitise url path', () => {
            expect(sanitiseUrlPath('/about/')).to.equal('about');
            expect(sanitiseUrlPath('/welsh/path/to/something/')).to.equal('path/to/something');
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
            ).to.eql({
                area: 'England',
                amount: '10001 - 50000',
                org: 'Voluntary or community organisation',
                sc: '1'
            });
        });
    });
});
