/* eslint-env jest */
'use strict';
const {
    englandRegions,
    englandLocationOptions,
    findLocationName,
} = require('./locations');

test('england region groups should match location groups', function () {
    const regionValues = englandRegions().map((region) => region.value);
    const locationGroups = englandLocationOptions().map((group) => group.id);
    expect(regionValues).toEqual(['all-england'].concat(locationGroups));
});

test('filter england location options by region', function () {
    const result = englandLocationOptions([
        'midlands',
        'yorkshire-and-the-humber',
    ]);
    expect(result.length).toBe(2);
    expect(result.map((group) => group.label)).toEqual([
        'East and West Midlands',
        'Yorkshire and the Humber',
    ]);
});

test('find location name from value', function () {
    expect(findLocationName('berkshire')).toBe('Berkshire');
    expect(findLocationName('north-yorkshire')).toBe('North Yorkshire');
    expect(findLocationName('west-midlands')).toBe('West Midlands');
    expect(findLocationName('derry-and-strabane')).toBe('Derry and Strabane');
    expect(findLocationName('not-a-valid-location')).toBeNull();
});
