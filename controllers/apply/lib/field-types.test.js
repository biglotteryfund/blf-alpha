/* eslint-env jest */
'use strict';
const { TextField, RadioField } = require('./field-types');

test('TextField', function() {
    const field = new TextField({
        name: 'example'
    });

    expect(field.type).toBe('text');
    expect(field.isRequired).toBeTruthy();
    expect(field.schema.validate().error.message).toEqual(
        '"value" is required'
    );

    const optionalField = new TextField({
        name: 'example',
        isRequired: false
    });

    expect(optionalField.isRequired).toBeFalsy();
    expect(optionalField.schema.validate().error).toBeNull();
});

test('RadioField', function() {
    const field = new RadioField({
        name: 'example',
        options: [
            { label: 'Option 1', value: 'option-1' },
            { label: 'Option 2', value: 'option-2' }
        ]
    });

    expect(field.isRequired).toBeTruthy();
    expect(field.schema.validate('bad-option').error.message).toEqual(
        expect.stringContaining('must be one of [option-1, option-2]')
    );
});
