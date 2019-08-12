/* eslint-env jest */
'use strict';
const baseJoi = require('@hapi/joi');
const Joi = baseJoi.extend(require('./phone-number'));

test('validate phone numbers', () => {
    const schema = Joi.string()
        .phoneNumber()
        .required();

    const validUkPhoneNumbers = [
        ['0345 4 10 20 30', '0345 410 2030'],
        ['028 9055 1455', '028 9055 1455'],
        ['03001237110', '0300 123 7110'],
        ['03001230735', '0300 123 0735']
    ];
    validUkPhoneNumbers.forEach(function([input, expected]) {
        const result = schema.validate(input);
        expect(result.value).toEqual(expected);
        expect(result.error).toBe(null);
    });

    const invalidPhoneNumbers = ['1', 'aa', '4444', '07134567'];
    invalidPhoneNumbers.forEach(function(input) {
        const result = schema.validate(input);
        expect(result.error.message).toContain(
            'did not seem to be a phone number'
        );
    });
});
