/* eslint-env jest */
'use strict';
const validateSurvey = require('./validate-survey');
const faker = require('faker');

function mapMessages(validationResult) {
    return validationResult.error.details.map(detail => {
        return detail.message;
    });
}

test('validate survey schema', () => {
    const valid = validateSurvey({
        choice: 'yes',
        path: '/some/path',
        message: faker.lorem.words(25)
    });

    expect(valid.error).toBeUndefined();

    const invalid = validateSurvey({
        choice: 'not-a-valid-choice'
    });

    expect(mapMessages(invalid)).toEqual([
        '"choice" must be one of [yes, no]',
        '"path" is required'
    ]);
});
