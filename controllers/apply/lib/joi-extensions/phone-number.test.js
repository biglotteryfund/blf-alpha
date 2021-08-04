/* eslint-env jest */
'use strict';
const Joi = require('./index');

test('return error for invalid phone numbers', () => {
    const invalidPhoneNumbers = ['1', 'aa', '4444', '07134567'];
    invalidPhoneNumbers.forEach(function (input) {
        const result = Joi.string().phoneNumber().required().validate(input);
        expect(result.value).toEqual(input);
        expect(result.error.message).toContain(
            'did not seem to be a phone number'
        );
    });
});

test('check valid phone numbers', () => {
    const validUkPhoneNumbers = [
        ['028 9 5 68 0143'],
        ['028 4378 00 03'],
        ['01418460447'],
        ['02921680214'],
    ];
    validUkPhoneNumbers.forEach(function ([input]) {
        const result = Joi.string().phoneNumber().required().validate(input);
        expect(result.error).toBeUndefined();
    });
});
