/* eslint-env jest */
'use strict';
const fromDateParts = require('./from-date-parts');

test('constructs moment instance from date parts', () => {
    const dt = fromDateParts({ day: 1, month: 6, year: 2020 });
    expect(dt.isValid()).toBe(true);
    expect(dt.format('YYYY-MM-DD')).toBe('2020-06-01');
});
