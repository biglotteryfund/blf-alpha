/* eslint-env mocha*/
'use strict';
const chai = require('chai');
const expect = chai.expect;

const filters = require('./filters');

describe('Filters', () => {
    it('should join as a string with delimiter if an array', () => {
        expect(filters.joinIfArray('not an array')).to.equal('not an array');
        expect(filters.joinIfArray(['a', 'list', 'of', 'words'], ', ')).to.equal('a, list, of, words');
        expect(filters.joinIfArray(['something', 'else'], '*')).to.equal('something*else');
    });

    it('should create a tel link', () => {
        expect(filters.makePhoneLink('0121 555 5555')).to.equal(
            '<a href="tel:01215555555" class="is-phone-link">0121 555 5555</a>'
        );
    });

    it('should create a mailto link', () => {
        expect(filters.mailto('example@example.com')).to.equal(
            '<a href="mailto:example@example.com">example@example.com</a>'
        );
    });

    it('should format a number with comma separators', () => {
        expect(filters.numberWithCommas(1548028)).to.equal('1,548,028');
    });

    it('should pluralise string', () => {
        expect(filters.pluralise(0, 'octopus', 'octopi')).to.equal('octopi');
        expect(filters.pluralise(1, 'octopus', 'octopi')).to.equal('octopus');
        expect(filters.pluralise(3, 'octopus', 'octopi')).to.equal('octopi');
    });
});
