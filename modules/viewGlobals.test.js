/* global describe, it */
'use strict';
const chai = require('chai');
const expect = chai.expect;

const { getCurrentSection } = require('./viewGlobals');

describe('View Globals', () => {
    describe('#getCurrentSection', () => {
        it('should return navigation section for a given page', () => {
            expect(getCurrentSection('toplevel', 'home')).to.equal('toplevel');
            expect(getCurrentSection('funding', 'root')).to.equal('funding');
            expect(getCurrentSection('funding', 'programmes')).to.equal('funding');
            expect(getCurrentSection('about', 'root')).to.equal('about');
            expect(getCurrentSection('toplevel', 'over10k')).to.be.undefined;
        });
    });
});
