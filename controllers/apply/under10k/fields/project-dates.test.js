/* eslint-env jest */
'use strict';
const { _getLeadTimeWeeks } = require('./project-dates');

test('lead time conditional on country', () => {
    expect(_getLeadTimeWeeks('england')).toBe(18);

    expect(_getLeadTimeWeeks('wales')).toBe(12);
    expect(_getLeadTimeWeeks('scotland')).toBe(12);
    expect(_getLeadTimeWeeks('northern-ireland')).toBe(12);
});
