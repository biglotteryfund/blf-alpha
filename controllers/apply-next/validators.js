'use strict';
const moment = require('moment');
const baseJoi = require('joi');
const { isEmpty, isArray, filter, toInteger, isObject } = require('lodash');

const { POSTCODE_REGEX } = require('../../modules/postcodes');

const dateObject = joi => {
    return {
        base: joi.date(),
        name: 'dateObject',
        coerce: function(value, state, options) {
            if (isObject(value)) {
                const date = moment({
                    year: toInteger(value.year),
                    // month is 0 indexed when constructing a date object
                    month: toInteger(value.month) - 1,
                    day: toInteger(value.day)
                });

                if (date.isValid()) {
                    return date.toISOString();
                } else {
                    return this.createError('date.isoDate', { v: value }, state, options);
                }
            } else {
                return value;
            }
        }
    };
};

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

const Joi = baseJoi.extend([dateObject, budgetValidator]);

module.exports = {
    Joi,
    postcode: Joi.string()
        .trim()
        .regex(POSTCODE_REGEX)
        .description('postcode'),
    futureDate: function({ amount = null, unit = null } = {}) {
        let minDate = 'now';
        if (amount && unit) {
            moment()
                .add(amount, unit)
                .format('YYYY-MM-DD');
        }

        return Joi.dateObject()
            .iso()
            .min(minDate);
    },
    dateOfBirth: function(minAge) {
        const maxDate = moment()
            .subtract(minAge, 'years')
            .format('YYYY-MM-DD');

        return Joi.dateObject()
            .iso()
            .max(maxDate);
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
