/* eslint-env jest */
'use strict';
const DateField = require('./date');

test('DateField', function() {
    const field = new DateField({
        name: 'example',
        label: 'Date field'
    });

    expect(field.type).toBe('date');

    const goodInput = { day: 1, month: 3, year: 2100 };
    const badInput = { day: 82, month: 3, year: 2100 };

    field.withValue(goodInput);
    expect(field.validate().error).toBeNull();
    expect(field.displayValue).toBe('1 March, 2100');

    field.withValue(badInput);
    expect(field.validate().error.message).toEqual(
        expect.stringContaining('contains an invalid value')
    );
});
