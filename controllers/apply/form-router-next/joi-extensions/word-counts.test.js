/* eslint-env jest */
// @ts-nocheck
'use strict';
const baseJoi = require('@hapi/joi');
const Joi = baseJoi.extend(require('./word-count'));
const faker = require('faker');

test('should validate that string is within word count limit', () => {
    const min = 10;
    const max = 25;

    const schema = Joi.string()
        .minWords(min)
        .maxWords(max);

    expect(schema.validate(faker.lorem.words(20)).error).toBeNull();

    expect(schema.validate(faker.lorem.words(min - 1)).error.message).toContain(
        'must have at least'
    );

    expect(schema.validate(faker.lorem.words(max + 1)).error.message).toContain(
        'must have less than'
    );
});
