/* eslint-env jest */
'use strict';
const faker = require('faker');

const TextareaField = require('./textarea');

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
