'use strict';
/* global describe, it */
const chai = require('chai');
const expect = chai.expect;

const { getMetaTitle } = require('./viewGlobals');

describe('View Globals', () => {
    describe('#getMetaTitle', () => {
        it('should return combined meta title when page title is set', () => {
            expect(getMetaTitle('Big Lottery Fund', 'Example')).to.equal('Example | Big Lottery Fund');
        });

        it('should return base title if no page title is set', () => {
            expect(getMetaTitle('Big Lottery Fund')).to.equal('Big Lottery Fund');
        });
    });
});
