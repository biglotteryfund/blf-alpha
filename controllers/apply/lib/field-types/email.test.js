/* eslint-env jest */
'use strict';
const EmailField = require('./email');

test('EmailField', function() {
    const field = new EmailField({
        name: 'example',
        label: 'Email field'
    });

    expect(field.type).toBe('email');

    const goodInput = 'example@example.com';
    const badInput = 'not.a.real-email@bad';

    field.withValue(goodInput);
    expect(field.validate().error).toBeNull();
    expect(field.displayValue).toBe(goodInput);

    field.withValue(badInput);
    expect(field.validate().error.message).toEqual(
        expect.stringContaining('must be a valid email')
    );
});
