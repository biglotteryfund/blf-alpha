/* eslint-env jest */
'use strict';
const Joi = require('./index');

test('allow comma separated values for numbers', () => {
    const valid = [
        ['1,000', 1000],
        ['10,000', 10000],
        ['1,000,000', 1000000],
        ['21,500.50', 21500.5],
    ];
    valid.forEach(function ([input, expected]) {
        const result = Joi.friendlyNumber().required().validate(input);
        expect(result.value).toEqual(expected);
        expect(result.error).toBeUndefined();
    });
});
