/* eslint-env jest */
'use strict';
const faker = require('faker');

const Joi = require('./index');

test('should validate that string is within word count limit', () => {
    const schema = Joi.string().minWords(10).maxWords(25);

    expect(schema.validate(faker.lorem.words(20)).error).toBeUndefined();
    expect(schema.validate(faker.lorem.words(9)).error.message).toBe(
        'must have at least 10 words'
    );
    expect(schema.validate(faker.lorem.words(26)).error.message).toBe(
        'must have no more than 25 words'
    );
});
