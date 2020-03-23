/* eslint-env jest */
'use strict';
const baseJoi = require('@hapi/joi');
const Joi = baseJoi.extend(require('./phone-number'));

const schema = Joi.string().phoneNumber().required();

test('return error for invalid phone numbers', () => {
    const invalidPhoneNumbers = ['1', 'aa', '4444', '07134567'];
    invalidPhoneNumbers.forEach(function (input) {
        const result = schema.validate(input);
        expect(result.value).toEqual(input);
        expect(result.error.message).toContain(
            'did not seem to be a phone number'
        );
    });
});

test('format valid phone numbers', () => {
    const validUkPhoneNumbers = [
        ['028 9 5 68 0143', '028 9568 0143'],
        ['028 4378 00 03', '028 4378 0003'],
        ['01418460447', '0141 846 0447'],
        ['02921680214', '029 2168 0214'],
    ];
    validUkPhoneNumbers.forEach(function ([input, expected]) {
        const result = schema.validate(input);
        expect(result.value).toEqual(expected);
        expect(result.error).toBe(null);
    });
});
