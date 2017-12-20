'use strict';
/* global describe, it */
const chai = require('chai');
const expect = chai.expect;

const { isWelshUrl, makeWelsh, cymreigio } = require('./locales');

describe('Locales', () => {
    describe('#isWelshUrl', () => {
        it('should strip trailing slashes correctly', () => {
            expect(isWelshUrl('/')).to.be.false;
            expect(isWelshUrl('/some/url')).to.be.false;
            expect(isWelshUrl('/welsh/some/url')).to.be.true;
        });
    });

    describe('#makeWelsh', () => {
        it('should convert URL path to welsh equivalent', () => {
            expect(makeWelsh('/experimental/apply')).to.equal('/welsh/experimental/apply');
        });
    });

    describe('#cymreigio', () => {
        it('should convert path to array of english and welsh paths', () => {
            expect(cymreigio('/experimental/apply')).to.eql(['/experimental/apply', '/welsh/experimental/apply']);
        });
    });
});
