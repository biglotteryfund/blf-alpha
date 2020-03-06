/* eslint-env jest */
'use strict';
const getLeadTimeWeeks = require('./lead-time');

test('lead time conditional on country', () => {
    expect(getLeadTimeWeeks('england')).toBe(18);

    expect(getLeadTimeWeeks('wales')).toBe(12);
    expect(getLeadTimeWeeks('scotland')).toBe(12);
    expect(getLeadTimeWeeks('northern-ireland')).toBe(12);
});
