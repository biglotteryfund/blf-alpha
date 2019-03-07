'use strict';
const baseJoi = require('joi');
const moment = require('moment');
const { isEmpty, isArray, filter } = require('lodash');

const budgetValidator = joi => {
    return {
        base: joi.array(),
        name: 'budgetItems',
        coerce(value, state, options) {
            if (isArray(value)) {
                // Strip out anything that doesn't have an item name and a cost
                // (eg. validate things that are half-supplied, but not empty)
                return filter(value, line => !isEmpty(line.item) || !isEmpty(line.cost));
            } else {
                return value;
            }
        },
        pre(value, state, options) {
            if (this._flags.maxBudget) {
                const total = value.reduce((acc, cur) => acc + cur.cost, 0);
                if (total > this._flags.maxBudget) {
                    return this.createError(
                        'budgetItems.overBudget',
                        { v: value, number: this._flags.maxBudget },
                        state,
                        options
                    );
                }
            }
            return value;
        },
        language: {
            maxBudget: 'needs to be a number'
        },
        rules: [
            {
                name: 'maxBudget',
                params: {
                    number: joi.number().required()
                },
                validate(params, value, state, options) {
                    if (!params.number) {
                        return this.createError(
                            'budgetItems.maxBudget',
                            { v: value, number: params.number },
                            state,
                            options
                        );
                    }
                    return value;
                },
                setup(params) {
                    this._flags.maxBudget = params.number;
                }
            }
        ]
    };
};

const Joi = baseJoi.extend([budgetValidator]);

module.exports = {
    Joi,
    postcode: Joi.string()
        // via https://github.com/chriso/validator.js/blob/master/lib/isPostalCode.js#L54
        .regex(/^(gir\s?0aa|[a-z]{1,2}\d[\da-z]?\s?(\d[a-z]{2})?)$/i)
        .description('postcode'),
    futureDate: function(amount, unit) {
        const minDate = moment()
            .add(amount, unit)
            .format('YYYY-MM-DD');

        return Joi.date().min(minDate);
    },
    dateOfBirth: function(minAge) {
        const maxDate = moment()
            .subtract(minAge, 'years')
            .format('YYYY-MM-DD');
        return Joi.date().max(maxDate);
    },
    budgetField: function(maxBudget) {
        return Joi.budgetItems()
            .min(1)
            .items(
                Joi.object({
                    item: Joi.string()
                        .trim()
                        .required(),
                    cost: Joi.number()
                        .required()
                        .min(1)
                        .max(maxBudget)
                })
            )
            .maxBudget(maxBudget)
            .required();
    }
};
