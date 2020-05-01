/* eslint-env jest */
'use strict';
const times = require('lodash/times');
const random = require('lodash/random');
const Joi = require('./index');

const schema = Joi.budgetItems().validBudgetRange(500, 5000).required();

test('valid budget', () => {
    const budget = times(10, function (i) {
        return { item: `Item ${i}`, cost: random(100, 200) };
    });

    const result = schema.validate(budget);
    expect(result.value).toStrictEqual(budget);
    expect(result.error).toBeUndefined();
});

test('under budget', () => {
    const budget = [
        { item: `Item 1`, cost: 100 },
        { item: `Item 2`, cost: 200 },
    ];

    const result = schema.validate(budget);
    expect(result.error.message).toContain(`under minimum budget of 500`);
});

test('over budget', () => {
    const budget = times(6, function (i) {
        return { item: `Item ${i}`, cost: 1000 };
    });

    const result = schema.validate(budget);
    expect(result.error.message).toContain(`over maximum budget of 5000`);
});
