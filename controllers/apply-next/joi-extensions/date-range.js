'use strict';
const { fromDateParts } = require('../../../modules/dates');

module.exports = function dateParts(joi) {
    return {
        name: 'dateRange',
        base: joi.object({
            start: {
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
            },
            end: {
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
            }
        }),
        language: {
            futureDate: 'Date must be at least {{min}}',
            dob: 'Must be at least {{minAge}} years old'
        },
        pre(value, state, options) {
            const dates = {
                start: fromDateParts(value.start),
                end: fromDateParts(value.end)
            };

            if (!dates.start.isValid() && !dates.end.isValid()) {
                return this.createError(
                    'dates.both.invalid',
                    { v: value },
                    state,
                    options
                );
            } else if (!dates.start.isValid()) {
                return this.createError(
                    'dates.start.invalid',
                    { v: value },
                    state,
                    options
                );
            } else if (!dates.end.isValid()) {
                return this.createError(
                    'dates.end.invalid',
                    { v: value },
                    state,
                    options
                );
            } else {
                return value;
            }
        },
        rules: [
            {
                name: 'minDate',
                params: {
                    min: joi.string().required()
                },
                validate(params, value, state, options) {
                    const dates = {
                        start: fromDateParts(value.start),
                        end: fromDateParts(value.end)
                    };
                    if (
                        dates.start.isValid() &&
                        dates.end.isValid() &&
                        dates.start.isSameOrAfter(params.min) &&
                        dates.end.isSameOrAfter(params.min)
                    ) {
                        return value;
                    } else {
                        return this.createError(
                            'dates.minDate.invalid',
                            { v: value, min: params.min },
                            state,
                            options
                        );
                    }
                }
            },
            {
                name: 'futureEndDate',
                validate(params, value, state, options) {
                    const dates = {
                        start: fromDateParts(value.start),
                        end: fromDateParts(value.end)
                    };
                    if (
                        dates.start.isValid() &&
                        dates.end.isValid() &&
                        dates.end.isSameOrAfter(dates.start)
                    ) {
                        return value;
                    } else {
                        return this.createError(
                            'dates.endDate.beforeStartDate',
                            { v: value, min: params.min },
                            state,
                            options
                        );
                    }
                }
            },
            {
                name: 'endDateLimit',
                params: {
                    amount: joi.number().required(),
                    units: joi.string().required()
                },
                validate(params, value, state, options) {
                    const dates = {
                        start: fromDateParts(value.start),
                        end: fromDateParts(value.end)
                    };

                    const maximumEndDate = dates.start.add(
                        params.amount,
                        params.units
                    );
                    if (
                        dates.start.isValid() &&
                        dates.end.isValid() &&
                        dates.end.isSameOrBefore(maximumEndDate)
                    ) {
                        return value;
                    } else {
                        return this.createError(
                            'dates.endDate.outsideLimit',
                            { v: value, min: params.min },
                            state,
                            options
                        );
                    }
                }
            }
        ]
    };
};
