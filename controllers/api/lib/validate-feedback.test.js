/* eslint-env jest */
'use strict';
const validateFeedback = require('./validate-feedback');
const faker = require('faker');

function mapMessages(validationResult) {
    return validationResult.error.details.map(detail => {
        return detail.message;
    });
}

test('validate feedback schema', () => {
    const valid = validateFeedback({
        description: 'description-id',
        message: faker.lorem.words(25)
    });

    expect(valid.error).toBeUndefined();

    expect(mapMessages(validateFeedback({}))).toEqual([
        '"description" is required',
        '"message" is required'
    ]);
});
