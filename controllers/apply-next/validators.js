'use strict';
const moment = require('moment');
const baseJoi = require('joi');
const { isEmpty, isArray, reject, toInteger } = require('lodash');

const { POSTCODE_REGEX } = require('../../modules/postcodes');

function dateFromParts(parts) {
    return moment({
        year: toInteger(parts.year),
        // month is 0 indexed when constructing a date object
        month: toInteger(parts.month) - 1,
        day: toInteger(parts.day)
    });
}

const dateParts = joi => {
    return {
        base: joi.object({
            day: joi
                .number()
                .integer()
                .required(),
            month: joi
                .number()
                .integer()
                .required(),
            year: joi
                .number()
                .integer()
                .required()
        }),
        name: 'dateParts',
        pre(value, state, options) {
            const date = dateFromParts(value);
            if (date.isValid()) {
                return value;
            } else {
                return this.createError('any.invalid', { v: value }, state, options);
            }
        },
        rules: [
            {
                name: 'futureDate',
                params: {
                    min: joi.string().required()
                },
                validate(params, value, state, options) {
                    const date = dateFromParts(value);
                    if (date.isValid() && date.isSameOrAfter(params.min)) {
                        return value;
                    } else {
                        return this.createError(
                            'dateParts.futureDate',
                            { v: value, number: params.number },
                            state,
                            options
                        );
                    }
                }
            },
            {
                name: 'dob',
                params: {
                    minAge: joi.number().required()
                },
                validate(params, value, state, options) {
                    const date = dateFromParts(value);
                    const maxDate = moment().subtract(params.minAge, 'years');
                    if (date.isValid() && date.isSameOrBefore(maxDate)) {
                        return value;
                    } else {
                        return this.createError('dateParts.dob', { v: value, number: params.number }, state, options);
                    }
                }
            }
        ]
    };
};

const budgetValidator = joi => {
    return {
        base: joi.array(),
        name: 'budgetItems',
        /* eslint-disable-next-line no-unused-vars */
        coerce(value, state, options) {
            if (isArray(value)) {
                // Strip out anything that doesn't have an item name and a cost
                // (eg. validate things that are half-supplied, but not empty)
                return reject(value, line => isEmpty(line.item) && isEmpty(line.cost));
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

const Joi = baseJoi.extend([dateParts, budgetValidator]);

module.exports = {
    Joi,
    postcode: Joi.string()
        .trim()
        .regex(POSTCODE_REGEX)
        .description('postcode'),
    futureDate: function({ amount = null, unit = null } = {}) {
        const minDate = amount && unit ? moment().add(amount, unit) : moment();
        return Joi.dateParts().futureDate(minDate.format('YYYY-MM-DD'));
    },
    dateOfBirth: function(minAge) {
        return Joi.dateParts().dob(minAge);
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
