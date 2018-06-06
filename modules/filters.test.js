/* eslint-env jest */
'use strict';

const filters = require('./filters');

describe('Filters', () => {
    it('should join as a string with delimiter if an array', () => {
        expect(filters.joinIfArray('not an array')).toBe('not an array');
        expect(filters.joinIfArray(['a', 'list', 'of', 'words'], ', ')).toBe('a, list, of, words');
        expect(filters.joinIfArray(['something', 'else'], '*')).toBe('something*else');
    });

    it('should create a tel link', () => {
        expect(filters.makePhoneLink('0121 555 5555')).toBe(
            '<a href="tel:01215555555" class="is-phone-link">0121 555 5555</a>'
        );
    });

    it('should create a mailto link', () => {
        expect(filters.mailto('example@example.com')).toBe(
            '<a href="mailto:example@example.com">example@example.com</a>'
        );
    });

    it('should format a number with comma separators', () => {
        expect(filters.numberWithCommas(1548028)).toBe('1,548,028');
    });

    it('should pluralise string', () => {
        expect(filters.pluralise(0, 'octopus', 'octopi')).toBe('octopi');
        expect(filters.pluralise(1, 'octopus', 'octopi')).toBe('octopus');
        expect(filters.pluralise(3, 'octopus', 'octopi')).toBe('octopi');
    });
});
