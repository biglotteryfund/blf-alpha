/* eslint-env jest */
'use strict';
const baseJoi = require('@hapi/joi');
const Joi = baseJoi.extend(require('joi-phone-number'));

test('validate phone numbers', () => {
    const schema = Joi.string()
        .phoneNumber({ defaultCountry: 'GB', format: 'national' })
        .required();

    expect(schema.validate('').error).toBeInstanceOf(Error);
    expect(schema.validate(' ').error).toBeInstanceOf(Error);
    expect(schema.validate('1').error).toBeInstanceOf(Error);
    expect(schema.validate('aa').error).toBeInstanceOf(Error);
    expect(schema.validate(1).error).toBeInstanceOf(Error);
    expect(schema.validate(123456).error).toBeInstanceOf(Error);
    expect(schema.validate(null).error).toBeInstanceOf(Error);
    expect(schema.validate({}).error).toBeInstanceOf(Error);

    expect(schema.validate('123').error).toBeNull();
    expect(schema.validate('+32494555890').error).toBeNull();
    expect(schema.validate('494322456').error).toBeNull();
    expect(schema.validate('011 69 37 83').error).toBeNull();

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

    const invalidUkPhoneNumbers = ['4444', '07134567'];

    invalidUkPhoneNumbers.forEach(function(input) {
        const result = schema.validate(input);
        expect(result.error).toContain('did not seem to be a phone number');
    });
});
