/* eslint-env jest */
'use strict';
const { englandRegions, englandLocationOptions } = require('./locations');

test('england region groups should match location groups', function() {
    const regionValues = englandRegions().map(region => region.value);
    const locationGroups = englandLocationOptions().map(group => group.id);
    expect(regionValues).toEqual(['all-england'].concat(locationGroups));
});

test('filter england location options by region', function() {
    const result = englandLocationOptions([
        'midlands',
        'yorkshire-and-the-humber'
    ]);
    expect(result.length).toBe(2);
    expect(result.map(group => group.label)).toEqual([
        'East and West Midlands',
        'Yorkshire and the Humber'
    ]);
});
