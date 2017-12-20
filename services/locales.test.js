'use strict';
/* global describe, it */
const chai = require('chai');
const expect = chai.expect;
const httpMocks = require('node-mocks-http');

const locales = require('./locales');

describe('Locales', () => {
    describe('#isWelshUrl', () => {
        it('should strip trailing slashes correctly', () => {
            expect(locales.isWelshUrl('/')).to.be.false;
            expect(locales.isWelshUrl('/some/url')).to.be.false;
            expect(locales.isWelshUrl('/welsh/some/url')).to.be.true;
        });
    });

    describe('#makeWelsh', () => {
        it('should convert URL path to welsh equivalent', () => {
            expect(locales.makeWelsh('/experimental/apply')).to.equal('/welsh/experimental/apply');
        });
    });

    describe('#cymreigio', () => {
        it('should convert path to array of english and welsh paths', () => {
            expect(locales.cymreigio('/experimental/apply')).to.eql([
                '/experimental/apply',
                '/welsh/experimental/apply'
            ]);
        });
    });

    describe('#rewriteFullUrlForLocale', () => {
        function makeResult(req, locale, urlPath) {
            return locales.rewriteFullUrlForLocale({
                locale: locale,
                urlPath: urlPath,
                protocol: req.get('X-Forwarded-Proto') || req.protocol,
                host: req.get('host')
            });
        }

        it('should rewrite full welsh URL if in welsh locale', () => {
            const req = httpMocks.createRequest({
                protocol: 'http',
                headers: {
                    Host: 'example.com'
                }
            });

            expect(makeResult(req, 'cy', '/')).to.equal('http://example.com/welsh');
            expect(makeResult(req, 'cy', '/about')).to.equal('http://example.com/welsh/about');
            expect(makeResult(req, 'cy', '/welsh/about')).to.equal('http://example.com/welsh/about');
        });

        it('should rewrite full english URL if in english locale', () => {
            const req = httpMocks.createRequest({
                protocol: 'http',
                headers: {
                    Host: 'example.com'
                }
            });

            expect(makeResult(req, 'en', '/')).to.equal('http://example.com');
            expect(makeResult(req, 'en', '/welsh')).to.equal('http://example.com');
            expect(makeResult(req, 'en', '/about')).to.equal('http://example.com/about');
            expect(makeResult(req, 'en', '/welsh/about')).to.equal('http://example.com/about');
        });

        it('should account for X-Forwarded-Proto', () => {
            const req = httpMocks.createRequest({
                protocol: 'http',
                headers: {
                    'X-Forwarded-Proto': 'https',
                    Host: 'example.com'
                }
            });

            expect(makeResult(req, 'cy', '/')).to.equal('https://example.com/welsh');
            expect(makeResult(req, 'cy', '/about')).to.equal('https://example.com/welsh/about');
            expect(makeResult(req, 'cy', '/welsh/about')).to.equal('https://example.com/welsh/about');
            expect(makeResult(req, 'en', '/')).to.equal('https://example.com');
            expect(makeResult(req, 'en', '/welsh')).to.equal('https://example.com');
            expect(makeResult(req, 'en', '/about')).to.equal('https://example.com/about');
            expect(makeResult(req, 'en', '/welsh/about')).to.equal('https://example.com/about');
        });
    });
});
