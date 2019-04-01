/* eslint-env jest */
'use strict';
const displayValue = require('./display-value');

describe('displayValue', () => {
    test('should format date', () => {
        const testDate = {
            day: 31,
            month: 7,
            year: 2100
        };

        expect(displayValue({ type: 'date' }, testDate)).toBe('31 July, 2100');
    });

    test('should format address', () => {
        const testAddress = {
            'building-street': 'Apex House, 3 Embassy Drive',
            'town-city': 'Birmingham',
            county: 'West Midlands',
            postcode: 'B15 1TR'
        };

        expect(displayValue({ type: 'address' }, testAddress)).toBe(
            'Apex House, 3 Embassy Drive,\nBirmingham,\nWest Midlands,\nB15 1TR'
        );
    });
});
