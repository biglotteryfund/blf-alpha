/* eslint-env jest */
'use strict';
const getLeadTimeWeeks = require('./lead-time');

test('lead time conditional on country', () => {
    expect(getLeadTimeWeeks('england', true)).toBe(18);
    ['scotland', 'northern-ireland', 'wales'].forEach(function(country) {
        expect(getLeadTimeWeeks(country, true)).toBe(12);
    });
});

test('lead time 18 weeks when variable lead times disabled', function() {
    ['england', 'scotland', 'northern-ireland', 'wales', null].forEach(function(
        country
    ) {
        expect(getLeadTimeWeeks(country, false)).toBe(18);
    });
});
