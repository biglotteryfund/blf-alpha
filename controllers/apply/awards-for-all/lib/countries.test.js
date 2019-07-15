/* eslint-env jest */
// @ts-nocheck
'use strict';
const countriesFor = require('./countries');

describe('countriesFor', () => {
    test('should return countries based on allow list', () => {
        expect(
            countriesFor({ locale: 'en', allowedCountries: ['england'] }).map(
                o => o.label
            )
        ).toEqual([
            'England',
            'Northern Ireland (coming soon)',
            'Scotland (coming soon)',
            'Wales (coming soon)'
        ]);

        expect(
            countriesFor({
                locale: 'en',
                allowedCountries: ['wales', 'scotland']
            }).map(o => o.label)
        ).toEqual([
            'Scotland',
            'Wales',
            'England (coming soon)',
            'Northern Ireland (coming soon)'
        ]);
    });
});
