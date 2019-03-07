/* eslint-env jest */
'use strict';

const { isValidPostcode } = require('../postcodes');

describe('Postcode validation', () => {
    const valid = [
        'B15',
        'EC4A 1DE',
        'TW8 9GS',
        'BS98 1TL',
        'DE99 3GG',
        'DE55 4SW',
        'DH98 1BT',
        'DH99 1NS',
        'GIR0aa',
        'SA99',
        'W1N 4DJ',
        'AA9A 9AA',
        'AA99 9AA',
        'BS98 1TL',
        'DE993GG'
    ];

    const invalid = ['London', 'Birmingham', 'not a postcode', 1, -Infinity];

    it('should correctly validate postcodes', () => {
        valid.forEach(postcode => {
            expect(isValidPostcode(postcode)).toBe(true);
        });

        invalid.forEach(postcode => {
            expect(isValidPostcode(postcode)).toBe(false);
        });
    });
});
