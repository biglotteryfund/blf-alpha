/* eslint-env jest */
'use strict';
const baseJoi = require('@hapi/joi');
const Joi = baseJoi.extend(require('./friendly-number'));

const schema = Joi.friendlyNumber().required();

test('allow comma separated values for numbers', () => {
    const valid = [
        ['1,000', 1000],
        ['10,000', 10000],
        ['1,000,000', 1000000],
        ['21,500.50', 21500.5]
    ];
    valid.forEach(function([input, expected]) {
        const result = schema.validate(input);
        expect(result.value).toEqual(expected);
        expect(result.error).toBe(null);
    });
});
