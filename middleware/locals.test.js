'use strict';
/* eslint-env mocha */
const chai = require('chai');
const expect = chai.expect;
const { getMetaTitle } = require('./locals');

describe('locals middleware', () => {
    it('should return meta title for page', () => {
        expect(getMetaTitle('Big Lottery Fund', 'Example')).to.equal('Example | Big Lottery Fund');
        expect(getMetaTitle('Big Lottery Fund')).to.equal('Big Lottery Fund');
    });
});
