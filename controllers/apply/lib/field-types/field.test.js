/* eslint-env jest */
'use strict';
const Field = require('./field');

test('Field base type', function() {
    const field = new Field({
        name: 'example',
        label: 'Text field'
    });

    expect(field.type).toBe('text');
    expect(field.isRequired).toBeTruthy();

    field.withValue();
    expect(field.validate().error.message).toEqual('"value" is required');

    const optionalField = new Field({
        name: 'example',
        label: 'Optional text field',
        isRequired: false
    });

    expect(optionalField.isRequired).toBeFalsy();
    expect(optionalField.validate().error).toBeNull();
});
