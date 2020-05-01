/* eslint-env jest */
'use strict';
const Joi = require('./index');

const schema = Joi.friendlyNumber().required();

test('allow comma separated values for numbers', () => {
    const valid = [
        ['1,000', 1000],
        ['10,000', 10000],
        ['1,000,000', 1000000],
        ['21,500.50', 21500.5],
    ];
    valid.forEach(function ([input, expected]) {
        const result = schema.validate(input);
        expect(result.value).toEqual(expected);
        expect(result.error).toBe(null);
    });
});
