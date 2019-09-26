/* eslint-env jest */
'use strict';
const PhoneField = require('./phone');

test('PhoneField', function() {
    const field = new PhoneField({
        name: 'example',
        label: 'Email field'
    });

    expect(field.type).toBe('tel');

    const goodValue = '0345 4 10 20 30';
    const badValue = '0345 444';

    field.withValue(goodValue);
    expect(field.validate().error).toBeNull();
    expect(field.validate().value).toBe('0345 410 2030');

    field.withValue(badValue);
    expect(field.validate().error.message).toEqual(
        expect.stringContaining('did not seem to be a phone number')
    );
});
