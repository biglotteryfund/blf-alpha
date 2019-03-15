'use strict';
const moment = require('moment');
const baseJoi = require('joi');
const { isEmpty, isArray, reject, toInteger, sumBy } = require('lodash');

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
        name: 'dateParts',
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

const dayMonth = joi => {
    return {
        name: 'dayMonth',
        base: joi.object({
            day: joi
                .number()
                .integer()
                .required(),
            month: joi
                .number()
                .integer()
                .required()
        }),
        pre(value, state, options) {
            const date = moment({
                year: moment().year(),
                month: toInteger(value.month) - 1,
                day: toInteger(value.day)
            });

            if (date.isValid()) {
                return value;
            } else {
                return this.createError('any.invalid', { v: value }, state, options);
            }
        }
    };
};

const budgetItems = joi => {
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
            overBudget: 'over maximum budget'
        },
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
        rules: [
            {
                name: 'maxBudget',
                params: {
                    maxBudget: joi.number().required()
                },
                validate(params, value, state, options) {
                    const total = sumBy(value, item => item.cost);
                    if (total > params.maxBudget) {
                        return this.createError(
                            'budgetItems.overBudget',
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

const Joi = baseJoi.extend([dateParts, dayMonth, budgetItems]);

module.exports = {
    Joi,
    postcode() {
        return Joi.string()
            .trim()
            .regex(POSTCODE_REGEX);
    },
    futureDate({ amount = null, unit = null } = {}) {
        const minDate = amount && unit ? moment().add(amount, unit) : moment();
        return Joi.dateParts().futureDate(minDate.format('YYYY-MM-DD'));
    },
    dateOfBirth(minAge) {
        return Joi.dateParts().dob(minAge);
    },
    budgetField(maxBudget) {
        return Joi.budgetItems()
            .maxBudget(maxBudget)
            .required();
    }
};
