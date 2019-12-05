'use strict';
const moment = require('moment');
const fromDateParts = require('../from-date-parts');

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
            minDate: 'Date must be on or after {{min}}',
            maxDate: 'Date must be on or before {{max}}',
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
                name: 'minDate',
                params: {
                    min: joi.string().required()
                },
                validate(params, value, state, options) {
                    const date = fromDateParts(value);

                    if (date.isValid() && date.isSameOrAfter(params.min)) {
                        return value;
                    } else {
                        return this.createError(
                            'dateParts.minDate',
                            { v: value, min: params.min },
                            state,
                            options
                        );
                    }
                }
            },
            {
                name: 'maxDate',
                params: {
                    max: joi.string().required()
                },
                validate(params, value, state, options) {
                    const date = fromDateParts(value);

                    if (date.isValid() && date.isSameOrBefore(params.max)) {
                        return value;
                    } else {
                        return this.createError(
                            'dateParts.maxDate',
                            { v: value, max: params.max },
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
                    const minDate = moment().subtract(120, 'years');

                    if (
                        date.isValid() &&
                        date.isSameOrBefore(maxDate) &&
                        date.isSameOrAfter(minDate)
                    ) {
                        return value;
                    } else if (date.isSameOrBefore(minDate)) {
                        return this.createError(
                            'dateParts.dob.tooOld',
                            { v: value, minAge: params.minAge },
                            state,
                            options
                        );
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
