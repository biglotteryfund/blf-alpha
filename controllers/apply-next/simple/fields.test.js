/* eslint-env jest */
'use strict';

const { filterOptionsBy } = require('../helpers');
const { legalContactRoles } = require('./fields');

describe('legalContactRoles', () => {
    test('return default roles', () => {
        expect(legalContactRoles.filter(filterOptionsBy()).map(option => option.value)).toEqual([
            'chair',
            'vice-chair',
            'treasurer',
            'trustee'
        ]);
    });

    test('add options based on data', () => {
        const resultA = legalContactRoles
            .filter(filterOptionsBy({ 'organisation-type': 'school' }))
            .map(option => option.value);

        expect(resultA).toEqual(['head-teacher', 'chair', 'vice-chair', 'treasurer', 'trustee']);

        const resultB = legalContactRoles
            .filter(filterOptionsBy({ 'organisation-type': 'statutory-body' }))
            .map(option => option.value);

        expect(resultB).toEqual(['clerk', 'chair', 'vice-chair', 'treasurer', 'trustee']);

        const resultC = legalContactRoles
            .filter(filterOptionsBy({ 'company-number': '12345678' }))
            .map(option => option.value);

        expect(resultC).toEqual(['director', 'company-secretary', 'chair', 'vice-chair', 'treasurer', 'trustee']);
    });
});
