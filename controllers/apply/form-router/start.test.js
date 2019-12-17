/* eslint-env jest */
'use strict';

const { getNextPageUrl } = require('./start');

test('determine next page url', function() {
    const result = getNextPageUrl('/example', false);
    expect(result).toEqual('/example/new');

    const resultEligibility = getNextPageUrl('/example', true);
    expect(resultEligibility).toEqual('/example/eligibility/1');
});
