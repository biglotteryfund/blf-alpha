'use strict';
const isArray = require('lodash/isArray');
const isEmpty = require('lodash/isEmpty');
const reject = require('lodash/reject');
const sumBy = require('lodash/sumBy');

module.exports = function budgetItems(joi) {
    return {
        name: 'budgetItems',
        base: joi
            .array()
            .min(1)
            .items(
                joi.object({
                    item: joi
                        .string()
                        .trim()
                        .max(255)
                        .required(),
                    cost: joi
                        .friendlyNumber()
                        .min(1)
                        .integer()
                        .required()
                })
            ),
        language: {
            overBudget: 'over maximum budget'
        },
        /* eslint-disable-next-line no-unused-vars */
        coerce(value, state, options) {
            if (isArray(value)) {
                // Strip out anything that doesn't have an item name and a cost
                // (eg. validate things that are half-supplied, but not empty)
                return reject(
                    value,
                    line => isEmpty(line.item) && isEmpty(line.cost)
                );
            } else {
                return value;
            }
        },
        rules: [
            {
                name: 'validBudgetRange',
                params: {
                    minBudget: joi.number().required(),
                    maxBudget: joi.number().required()
                },
                validate(params, value, state, options) {
                    const total = sumBy(
                        value,
                        item => parseInt(item.cost, 10) || 0
                    );
                    if (total > params.maxBudget) {
                        return this.createError(
                            'budgetItems.overBudget',
                            { v: value, number: params.maxBudget },
                            state,
                            options
                        );
                    } else if (total < params.minBudget) {
                        return this.createError(
                            'budgetItems.underBudget',
                            { v: value, number: params.maxBudget },
                            state,
                            options
                        );
                    } else {
                        return value;
                    }
                }
            }
        ]
    };
};
