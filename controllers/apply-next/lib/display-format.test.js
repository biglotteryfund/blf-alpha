/* eslint-env jest */
'use strict';
const displayFormat = require('./display-format');

describe('displayFormat', () => {
    test('should format date', () => {
        const testDate = {
            day: 31,
            month: 7,
            year: 2100
        };

        expect(displayFormat({ type: 'date' }, testDate)).toBe('31 July, 2100');
    });

    test('should format address', () => {
        const testAddress = {
            'building-street': 'Apex House, 3 Embassy Drive',
            'town-city': 'Birmingham',
            county: 'West Midlands',
            postcode: 'B15 1TR'
        };

        expect(displayFormat({ type: 'address' }, testAddress)).toBe(
            'Apex House, 3 Embassy Drive,\nBirmingham,\nWest Midlands,\nB15 1TR'
        );
    });
});
