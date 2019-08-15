/* eslint-env jest */
'use strict';
const baseJoi = require('@hapi/joi');
const Joi = baseJoi.extend(require('./budget-items'));

test('validate budget items and strip out empty rows', () => {
    const schema = Joi.budgetItems().required();

    const validResult = schema.validate([
        { item: 'Example item 2', cost: 1000 },
        { item: 'Example item 2', cost: 2000 },
        { item: null, cost: null }
    ]);
    expect(validResult.value).toEqual([
        { item: 'Example item 2', cost: 1000 },
        { item: 'Example item 2', cost: 2000 }
    ]);
    expect(validResult.error).toBe(null);
});

test('require both item and cost', () => {
    const schema = Joi.budgetItems().required();

    const invalidResult = schema.validate([
        { item: 'Partial item' },
        { cost: 2000 }
    ]);

    expect(invalidResult.error.message).toContain('"cost" is required');
});

test('total must be within budget range', () => {
    const schema = Joi.budgetItems()
        .minTotal(300)
        .maxTotal(1000)
        .required();

    const overBudget = schema.validate([
        { item: 'Item 1', cost: 500 },
        { item: 'Item 1', cost: 500 },
        { item: 'Item 2', cost: 100 }
    ]);

    expect(overBudget.error.message).toContain('over maximum budget');

    const underBudget = schema.validate([
        { item: 'Item 1', cost: 100 },
        { item: 'Item 1', cost: 100 }
    ]);

    expect(underBudget.error.message).toContain('under minimum budget');
});
