'use strict';
const isArray = require('lodash/isArray');
const isEmpty = require('lodash/isEmpty');
const reject = require('lodash/reject');
const sumBy = require('lodash/sumBy');

module.exports = function budgetItems(joi) {
    return {
        type: 'budgetItems',
        base: joi
            .array()
            .min(1)
            .items(
                joi.object({
                    item: joi.string().trim().max(255).required(),
                    cost: joi.friendlyNumber().min(1).integer().required(),
                })
            ),
        messages: {
            'budgetItems.overBudget': 'over maximum budget of {{#limit}}',
            'budgetItems.underBudget': 'under minimum budget of {{#limit}}',
        },
        coerce: {
            method(value) {
                if (isArray(value)) {
                    // Strip out anything that doesn't have an item name and a cost
                    // (eg. validate things that are half-supplied, but not empty)
                    const newValue = reject(value, function (line) {
                        return isEmpty(line.item) && isEmpty(line.cost);
                    });

                    return { value: newValue };
                } else {
                    return { value };
                }
            },
        },
        rules: {
            validBudgetRange: {
                method(minBudget, maxBudget) {
                    return this.$_addRule({
                        name: 'validBudgetRange',
                        args: { minBudget, maxBudget },
                    });
                },
                args: [
                    {
                        name: 'minBudget',
                        assert: joi.number().required(),
                    },
                    {
                        name: 'maxBudget',
                        assert: joi.number().required(),
                    },
                ],
                validate(value, helpers, args) {
                    const total = sumBy(value, function (item) {
                        return parseInt(item.cost, 10) || 0;
                    });

                    if (total > args.maxBudget) {
                        return helpers.error('budgetItems.overBudget', {
                            limit: args.maxBudget,
                        });
                    } else if (total < args.minBudget) {
                        return helpers.error('budgetItems.underBudget', {
                            limit: args.minBudget,
                        });
                    } else {
                        return value;
                    }
                },
            },
        },
    };
};
