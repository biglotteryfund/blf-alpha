'use strict';
const isArray = require('lodash/isArray');
const isEmpty = require('lodash/isEmpty');
const reject = require('lodash/fp/reject');
const sumBy = require('lodash/fp/sumBy');

const sumByCost = sumBy(item => parseInt(item.cost, 10) || 0);

/**
 * Strip out anything that doesn't have an item name and a cost
 * eg. validate things that are half-supplied, but not empty
 */
const rejectEmpty = reject(line => isEmpty(line.item) && isEmpty(line.cost));

module.exports = function(joi) {
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
                        .required(),
                    cost: joi
                        .number()
                        .min(1)
                        .integer()
                        .required()
                })
            ),
        language: {
            overBudget: 'over maximum budget',
            underBudget: 'under minimum budget'
        },
        /* eslint-disable-next-line no-unused-vars */
        coerce(value, state, options) {
            if (isArray(value)) {
                return rejectEmpty(value);
            } else {
                return value;
            }
        },
        rules: [
            {
                name: 'minTotal',
                params: {
                    min: joi.number().required()
                },
                validate(params, value, state, options) {
                    if (sumByCost(value) < params.min) {
                        return this.createError(
                            'budgetItems.underBudget',
                            { v: value, min: params.min },
                            state,
                            options
                        );
                    } else {
                        return value;
                    }
                }
            },
            {
                name: 'maxTotal',
                params: {
                    max: joi.number().required()
                },
                validate(params, value, state, options) {
                    if (sumByCost(value) > params.max) {
                        return this.createError(
                            'budgetItems.overBudget',
                            { v: value, max: params.max },
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
