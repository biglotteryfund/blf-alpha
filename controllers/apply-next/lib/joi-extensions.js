'use strict';
const { get, isEmpty, isArray, reject, toInteger, sumBy } = require('lodash');
const moment = require('moment');
const baseJoi = require('@hapi/joi');
const phoneNumber = require('joi-phone-number');

/**
 * Count words
 * Matches consecutive non-whitespace chars
 * If changing match this with word-count.vue
 * @param {string} text
 */
function countWords(text) {
    if (text) {
        const tokens = text.trim().match(/\S+/g) || [];
        return tokens.length;
    } else {
        return 0;
    }
}

function dateFromParts(parts) {
    return moment({
        year: toInteger(parts.year),
        // month is 0 indexed when constructing a date object
        month: toInteger(parts.month) - 1,
        day: toInteger(parts.day)
    });
}

const wordCount = joi => {
    return {
        base: joi.string(),
        name: 'string',
        language: {
            maxWords: 'must have less than {{max}} words',
            minWords: 'must have at least {{min}} words'
        },
        rules: [
            {
                name: 'maxWords',
                params: {
                    max: joi
                        .number()
                        .integer()
                        .min(0)
                        .required()
                },
                validate(params, value, state, options) {
                    if (countWords(value) > params.max) {
                        return this.createError(
                            'string.maxWords',
                            { max: params.max },
                            state,
                            options
                        );
                    } else {
                        return value;
                    }
                }
            },
            {
                name: 'minWords',
                params: {
                    min: joi
                        .number()
                        .integer()
                        .min(0)
                        .required()
                },
                validate(params, value, state, options) {
                    if (countWords(value) < params.min) {
                        return this.createError(
                            'string.minWords',
                            { min: params.min },
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
        language: {
            futureDate: 'Date must be at least {{min}}',
            dob: 'Must be at least {{minAge}} years old'
        },
        pre(value, state, options) {
            const date = dateFromParts(value);
            if (date.isValid()) {
                return value;
            } else {
                return this.createError(
                    'any.invalid',
                    { v: value },
                    state,
                    options
                );
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
                            { v: value, min: params.min },
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
                        return this.createError(
                            'dateParts.dob',
                            { v: value, minAge: params.minAge },
                            state,
                            options
                        );
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
                return this.createError(
                    'any.invalid',
                    { v: value },
                    state,
                    options
                );
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

const budgetTotalCosts = joi => {
    return {
        name: 'budgetTotalCosts',
        base: joi.number(),
        language: {
            underBudget: 'under project budget total'
        },
        /* eslint-disable-next-line no-unused-vars */
        pre(value, state, options) {
            const projectBudget = get(state.parent, 'project-budget');
            if (projectBudget) {
                const total = sumBy(projectBudget, item => item.cost);
                if (value < total) {
                    return this.createError(
                        'budgetTotalCosts.underBudget',
                        { v: value },
                        state,
                        options
                    );
                }
            }
            return value;
        }
    };
};

module.exports = baseJoi.extend([
    phoneNumber,
    wordCount,
    dateParts,
    dayMonth,
    budgetItems,
    budgetTotalCosts
]);
