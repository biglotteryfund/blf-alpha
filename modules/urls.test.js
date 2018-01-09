'use strict';
/* global describe, it */
const chai = require('chai');
const expect = chai.expect;

const { isWelsh, localify, stripTrailingSlashes } = require('./urls');

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

    describe('#stripTrailingSlashes', () => {
        it('should strip trailing slashes correctly', done => {
            let pathWithSlash = '/foo/';
            let pathWithoutSlash = '/bar';
            let pathToHomepage = '/';
            expect(stripTrailingSlashes(pathWithSlash)).to.equal('/foo');
            expect(stripTrailingSlashes(pathWithoutSlash)).to.equal('/bar');
            expect(stripTrailingSlashes(pathToHomepage)).to.equal('/');
            done();
        });
    });
});
