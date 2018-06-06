/* eslint-env mocha */
'use strict';
const chai = require('chai');
const expect = chai.expect;

const { toSeconds } = require('./cached');

describe('cached', () => {
    it('should convert natural time to seconds', () => {
        expect(toSeconds('10s')).to.equal(10);
        expect(toSeconds('30m')).to.equal(1800);
    });
});
