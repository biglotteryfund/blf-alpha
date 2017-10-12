'use strict';
/* global describe, it */
const chai = require('chai');
const expect = chai.expect;

const utilities = require('../../modules/utilities');

describe('utility functions', () => {
    it('should strip trailing slashes correctly', done => {
        let pathWithSlash = '/foo/';
        let pathWithoutSlash = '/bar';
        let pathToHomepage = '/';
        expect(utilities.stripTrailingSlashes(pathWithSlash)).to.equal('/foo');
        expect(utilities.stripTrailingSlashes(pathWithoutSlash)).to.equal('/bar');
        expect(utilities.stripTrailingSlashes(pathToHomepage)).to.equal('/');
        done();
    });

    it('should parse numbers from text strings correctly', done => {
        const exampleRanges = [
            ['£10,000 - £1 million', 1000000],
            ['£10,000 - £150,000', 150000],
            ['£10,000 - £1 million', 1000000],
            ['£300 - £10,000', 10000],
            ['£10,000 - £1 million', 1000000],
            ['£10,000 - £1 million', 1000000],
            ['£10,000 - £50,000', 50000],
            ['foo', 'foo']
        ];

        exampleRanges.forEach(e => {
            let input = e[0];
            let output = e[1];
            expect(utilities.parseValueFromString(input)).to.equal(output);
        });

        done();
    });
});
