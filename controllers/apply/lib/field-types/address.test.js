/* eslint-env jest */
'use strict';
const AddressField = require('./address');

test('AddressField', function() {
    const field = new AddressField({
        name: 'example',
        label: 'Address field'
    });

    expect(field.type).toBe('address');

    field.withValue({
        line1: '1234 example street',
        townCity: 'Birmingham',
        county: 'West Midlands'
    });

    expect(field.validate().error.message).toEqual(
        expect.stringContaining(`"postcode" is required`)
    );

    field.withValue({
        line1: '1234 example street',
        townCity: 'Birmingham',
        county: 'West Midlands',
        postcode: 'B15 1TR'
    });

    expect(field.displayValue).toBe(
        '1234 example street,\nBirmingham,\nWest Midlands,\nB15 1TR'
    );
});
