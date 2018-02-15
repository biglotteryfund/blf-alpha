'use strict';
/* global describe, it */
const chai = require('chai');
const expect = chai.expect;

const {
    getBaseUrl,
    hasTrailingSlash,
    isRegionalUrl,
    isWelsh,
    localify,
    normaliseQuery,
    stripRegion,
    stripTrailingSlashes
} = require('./urls');

const httpMocks = require('node-mocks-http');

describe('URL Helpers', () => {
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
            expect(
                localify({
                    urlPath: '/funding/funding-finder',
                    locale: 'en'
                })
            ).to.equal('/funding/funding-finder');

            expect(
                localify({
                    urlPath: '/funding/funding-finder',
                    locale: 'cy'
                })
            ).to.equal('/welsh/funding/funding-finder');

            expect(
                localify({
                    urlPath: '/welsh/funding/funding-finder',
                    locale: 'en'
                })
            ).to.equal('/funding/funding-finder');

            expect(
                localify({
                    urlPath: '/welsh/funding/funding-finder',
                    locale: 'cy'
                })
            ).to.equal('/welsh/funding/funding-finder');
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

    describe('#isRegionalUrl', () => {
        it('should determine if a url is a regional variant', () => {
            expect(isRegionalUrl('/about-big/some/url')).to.be.false;
            expect(isRegionalUrl('/about-big/some/scotland/url')).to.be.false;
            expect(isRegionalUrl('/england/about-big/some/url')).to.be.true;
            expect(isRegionalUrl('/scotland/about-big/some/url')).to.be.true;
            expect(isRegionalUrl('/wales/about-big/some/url')).to.be.true;
            expect(isRegionalUrl('/northernIreland/about-big/some/url')).to.be.true;
        });
    });

    describe('#stripRegion', () => {
        it('should strip regional component from the start of a url path', () => {
            expect(stripRegion('/some/url')).to.equal('/some/url');
            expect(stripRegion('/england/some/url')).to.equal('/some/url');
            expect(stripRegion('/scotland/some/url')).to.equal('/some/url');
            expect(stripRegion('/wales/some/url')).to.equal('/some/url');
            expect(stripRegion('/northernIreland/some/url')).to.equal('/some/url');
        });
    });
});
