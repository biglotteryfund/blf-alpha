'use strict';
const { fromDateParts } = require('../lib/date-parts');

module.exports = function dateParts(joi) {
    const datePartsConfig = {
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
    };

    function toRange(value) {
        return {
            startDate: fromDateParts(value.startDate),
            endDate: fromDateParts(value.endDate)
        };
    }

    return {
        name: 'dateRange',
        base: joi.object({
            startDate: datePartsConfig,
            endDate: datePartsConfig
        }),
        language: {
            both: {
                invalid: 'Both startDate and endDate are invalid'
            },
            startDate: {
                invalid: 'Invalid startDate'
            },
            endDate: {
                invalid: 'Invalid endDate',
                beforeStartDate: 'endDate must not be before startDate'
            },
            minDate: {
                invalid: 'Date must be at least {{min}}'
            },
            maxDate: {
                invalid: 'Date is outside limit'
            }
        },
        pre(value, state, options) {
            const dates = toRange(value);

            if (!dates.startDate.isValid() && !dates.endDate.isValid()) {
                return this.createError(
                    'dateRange.both.invalid',
                    { v: value },
                    state,
                    options
                );
            } else if (!dates.startDate.isValid()) {
                return this.createError(
                    'dateRange.startDate.invalid',
                    { v: value },
                    state,
                    options
                );
            } else if (!dates.endDate.isValid()) {
                return this.createError(
                    'dateRange.endDate.invalid',
                    { v: value },
                    state,
                    options
                );
            } else if (dates.endDate.isSameOrAfter(dates.startDate) === false) {
                return this.createError(
                    'dateRange.endDate.beforeStartDate',
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
                    const dates = toRange(value);

                    if (
                        dates.startDate.isValid() &&
                        dates.endDate.isValid() &&
                        dates.startDate.isSameOrAfter(params.min) &&
                        dates.endDate.isSameOrAfter(params.min)
                    ) {
                        return value;
                    } else {
                        return this.createError(
                            'dateRange.minDate.invalid',
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
                    const dates = toRange(value);

                    if (
                        dates.startDate.isValid() &&
                        dates.endDate.isValid() &&
                        dates.endDate.isSameOrBefore(params.max)
                    ) {
                        return value;
                    } else {
                        return this.createError(
                            'dateRange.maxDate.invalid',
                            { v: value, max: params.max },
                            state,
                            options
                        );
                    }
                }
            }
        ]
    };
};
