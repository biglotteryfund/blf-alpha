/* eslint-env jest */
'use strict';
const { fromDateParts } = require('./date-parts');

describe('fromDateParts', () => {
    test('constructs moment instance from date parts', () => {
        const momentDt = fromDateParts({
            day: 1,
            month: 6,
            year: 2020
        });

        expect(momentDt.isValid()).toBe(true);
        expect(momentDt.format('YYYY-MM-DD')).toBe('2020-06-01');
    });
});
