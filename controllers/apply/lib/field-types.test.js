/* eslint-env jest */
'use strict';
const {
    TextField,
    EmailField,
    PhoneField,
    RadioField
} = require('./field-types');

test('TextField', function() {
    const field = new TextField({
        name: 'example',
        label: 'Text field'
    });

    expect(field.type).toBe('text');
    expect(field.isRequired).toBeTruthy();
    expect(field.schema.validate().error.message).toEqual(
        '"value" is required'
    );

    const optionalField = new TextField({
        name: 'example',
        label: 'Optional text field',
        isRequired: false
    });

    expect(optionalField.isRequired).toBeFalsy();
    expect(optionalField.schema.validate().error).toBeNull();
});

test('EmailField', function() {
    const field = new EmailField({
        name: 'example',
        label: 'Email field'
    });

    expect(field.schema.validate('example@example.com').error).toBeNull();
    expect(field.schema.validate('not.a.real-email@bad').error.message).toEqual(
        expect.stringContaining('must be a valid email')
    );
});

test('PhoneField', function() {
    const field = new PhoneField({
        name: 'example',
        label: 'Email field'
    });

    expect(field.schema.validate('0345 4 10 20 30').error).toBeNull();
    expect(field.schema.validate('0345 444').error.message).toEqual(
        expect.stringContaining('did not seem to be a phone number')
    );
});

test('RadioField', function() {
    const field = new RadioField({
        name: 'example',
        label: 'Radio field',
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
