'use strict';
const moment = require('moment');
const { fromDateParts } = require('../../../common/dates');

module.exports = function dateParts(joi) {
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
            const dt = fromDateParts(value);
            if (dt.isValid()) {
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
                    const date = fromDateParts(value);
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
                    const date = fromDateParts(value);
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
