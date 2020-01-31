/* eslint-env jest */
'use strict';
const getLeadTimeWeeks = require('./lead-time');

test('lead time conditional on country', () => {
    expect(getLeadTimeWeeks('england', true)).toBe(18);
    expect(getLeadTimeWeeks('wales', true)).toBe(18);

    expect(getLeadTimeWeeks('scotland', true)).toBe(12);
    expect(getLeadTimeWeeks('northern-ireland', true)).toBe(12);
});

test('lead time 18 weeks when variable lead times disabled', function() {
    ['england', 'scotland', 'northern-ireland', 'wales', null].forEach(function(
        country
    ) {
        expect(getLeadTimeWeeks(country, false)).toBe(18);
    });
});
