'use strict';
const fromDateParts = require('../from-date-parts');

module.exports = function dateParts(joi) {
    const datePartsConfig = {
        day: joi.number().integer().required(),
        month: joi.number().integer().required(),
        year: joi.number().integer().required(),
    };

    function toRange(value) {
        return {
            startDate: fromDateParts(value.startDate),
            endDate: fromDateParts(value.endDate),
        };
    }

    return {
        type: 'dateRange',
        base: joi.object({
            startDate: datePartsConfig,
            endDate: datePartsConfig,
        }),
        messages: {
            'dateRange.both.invalid': 'Both startDate and endDate are invalid',
            'dateRange.startDate.invalid': 'Invalid startDate',
            'dateRange.endDate.invalid': 'Invalid endDate',
            'dateRange.endDate.outsideLimit': 'Date is outside limit',
            'dateRange.endDate.beforeStartDate':
                'endDate must not be before startDate',
            'dateRange.minDate.invalid': 'Date must be at least {{#min}}',
            'dateRange.maxDate.invalid': 'Date is outside limit',
        },
        validate(value, helpers) {
            const dates = toRange(value);

            if (!dates.startDate.isValid() && !dates.endDate.isValid()) {
                return { errors: helpers.error('dateRange.both.invalid') };
            } else if (!dates.startDate.isValid()) {
                return { errors: helpers.error('dateRange.startDate.invalid') };
            } else if (!dates.endDate.isValid()) {
                return { errors: helpers.error('dateRange.endDate.invalid') };
            } else if (dates.endDate.isSameOrAfter(dates.startDate) === false) {
                return {
                    errors: helpers.error('dateRange.endDate.beforeStartDate'),
                };
            } else {
                return { value };
            }
        },
        rules: {
            minDate: {
                method(min) {
                    return this.$_addRule({
                        name: 'minDate',
                        args: { min },
                    });
                },
                args: [
                    {
                        name: 'min',
                        assert: joi.string().required(),
                        message: 'must be a date string',
                    },
                ],
                validate(value, helpers, args) {
                    const dates = toRange(value);

                    if (
                        dates.startDate.isValid() &&
                        dates.endDate.isValid() &&
                        dates.startDate.isSameOrAfter(args.min) &&
                        dates.endDate.isSameOrAfter(args.min)
                    ) {
                        return value;
                    } else {
                        return helpers.error('dateRange.minDate.invalid', {
                            min: args.min,
                        });
                    }
                },
            },
            endDateLimit: {
                method(amount, unit) {
                    return this.$_addRule({
                        name: 'endDateLimit',
                        args: { amount, unit },
                    });
                },
                args: [
                    {
                        name: 'amount',
                        assert: joi.number().required(),
                    },
                    {
                        name: 'unit',
                        assert: joi.string().required(),
                    },
                ],
                validate(value, helpers, args) {
                    const dates = toRange(value);

                    const maximumEndDate = dates.startDate
                        .clone()
                        .add(args.amount, args.unit);

                    if (
                        dates.startDate.isValid() &&
                        dates.endDate.isValid() &&
                        dates.endDate.isSameOrBefore(maximumEndDate)
                    ) {
                        return value;
                    } else {
                        return helpers.error('dateRange.endDate.outsideLimit');
                    }
                },
            },
        },
    };
};
