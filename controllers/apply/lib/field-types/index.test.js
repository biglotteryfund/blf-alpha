/* eslint-env jest */
'use strict';
const faker = require('faker');

const {
    EmailField,
    PhoneField,
    CurrencyField,
    TextareaField,
    RadioField,
    CheckboxField,
    SelectField,
    AddressField,
    NameField
} = require('./index');

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

test('CurrencyField', function() {
    const field = new CurrencyField({
        name: 'example',
        label: 'Currency field'
    });

    expect(field.type).toBe('currency');

    field.withValue('120,000');

    expect(field.validate().error).toBeNull();
    expect(field.validate().value).toBe(120000);
    expect(field.displayValue).toBe('£120,000');
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

    expect(field.type).toBe('radio');

    field.withValue('option-1');
    expect(field.displayValue).toBe('Option 1');
    expect(field.validate().error).toBeNull();

    field.withValue('bad-option');
    expect(field.validate().error.message).toEqual(
        expect.stringContaining('must be one of')
    );
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

    expect(field.type).toBe('checkbox');

    field.withValue(['option-1', 'option-2']);
    expect(field.displayValue).toBe('Option 1,\nOption 2');
    expect(field.validate().error).toBeNull();

    field.withValue(['bad-option']);
    expect(field.validate().error.message).toEqual(
        expect.stringContaining('must be one of')
    );
});

test('SelectField', function() {
    const field = new SelectField({
        name: 'example',
        label: 'Checkbox field',
        options: [
            { label: 'Option 1', value: 'option-1' },
            { label: 'Option 2', value: 'option-2' },
            { label: 'Option 3', value: 'option-3' }
        ]
    });

    expect(field.type).toBe('select');

    field.withValue('option-2');
    expect(field.displayValue).toBe('Option 2');
    expect(field.validate().error).toBeNull();

    field.withValue('bad-option');
    expect(field.validate().error.message).toEqual(
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

    expect(field.type).toBe('textarea');

    const goodValue = faker.lorem.words(minWords + 1);

    field.withValue(goodValue);
    expect(field.displayValue).toEqual(
        `${goodValue}\n\n(${minWords + 1} words)`
    );
    expect(field.validate().error).toBeNull();

    field.withValue(faker.lorem.words(minWords - 1));
    expect(field.validate().error.message).toEqual(
        expect.stringContaining(`must have at least ${minWords} words`)
    );

    field.withValue(faker.lorem.words(maxWords + 1));
    expect(field.validate().error.message).toEqual(
        expect.stringContaining(`must have less than ${maxWords} words`)
    );

    const optionalField = new TextareaField({
        name: 'example',
        isRequired: false,
        label: 'Radio field',
        minWords: minWords,
        maxWords: maxWords
    });

    expect(optionalField.validate().error).toBeNull();
});

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

test('NameField', function() {
    const field = new NameField({
        name: 'example',
        label: 'Name field'
    });

    expect(field.type).toBe('full-name');
    field.withValue({ firstName: 'Björk', lastName: 'Guðmundsdóttir' });
    expect(field.displayValue).toBe('Björk Guðmundsdóttir');
});
