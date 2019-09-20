/* eslint-env jest */
'use strict';
const faker = require('faker');

const {
    TextField,
    EmailField,
    PhoneField,
    CurrencyField,
    TextareaField,
    RadioField,
    CheckboxField
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

test('CurrencyField', function() {
    const field = new CurrencyField({
        name: 'example',
        label: 'Currency field'
    });

    const validationResult = field.schema.validate('120,000');
    expect(validationResult.error).toBeNull();
    expect(validationResult.value).toBe(120000);
    expect(field.schema.validate().error).not.toBeNull();
});

test('CheckboxField', function() {
    const field = new CheckboxField({
        name: 'example',
        label: 'Checkbox field',
        options: [
            { label: 'Option 1', value: 'option-1' },
            { label: 'Option 2', value: 'option-2' },
            { label: 'Option 3', value: 'option-3' }
        ]
    });

    expect(field.schema.validate(['option-1', 'option-2']).error).toBeNull();
    expect(field.schema.validate(['bad-option']).error.message).toEqual(
        expect.stringContaining('must be one of')
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
        expect.stringContaining('must be one of')
    );
});

test('TextareaField', function() {
    const minWords = 50;
    const maxWords = 150;

    const field = new TextareaField({
        name: 'example',
        label: 'Textarea field',
        minWords: minWords,
        maxWords: maxWords
    });

    expect(
        field.schema.validate(faker.lorem.words(minWords + 1)).error
    ).toBeNull();

    expect(
        field.schema.validate(faker.lorem.words(minWords - 1)).error.message
    ).toEqual(expect.stringContaining(`must have at least ${minWords} words`));

    expect(
        field.schema.validate(faker.lorem.words(maxWords + 1)).error.message
    ).toEqual(expect.stringContaining(`must have less than ${maxWords} words`));

    const optionalField = new TextareaField({
        name: 'example',
        isRequired: false,
        label: 'Radio field',
        minWords: minWords,
        maxWords: maxWords
    });

    expect(optionalField.schema.validate().error).toBeNull();
});
