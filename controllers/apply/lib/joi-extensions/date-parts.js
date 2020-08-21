'use strict';
const moment = require('moment');
const fromDateParts = require('../from-date-parts');

module.exports = function dateParts(joi) {
    const datePartsSchema = joi.object({
        day: joi.number().integer().required(),
        month: joi.number().integer().required(),
        year: joi.number().integer().required(),
    });

    return {
        type: 'dateParts',
        base: datePartsSchema,
        messages: {
            'dateParts.minDate': 'Date must be on or after {{#min}}',
            'dateParts.minDateRef': 'Date must be on or after referenced date',
            'dateParts.maxDate': 'Date must be on or before {{#max}}',
            'dateParts.rangeLimit': `Date must be within {{#limit.amount}} {{#limit.unit}} of referenced date`,
        },
        validate(value, helpers) {
            const dt = fromDateParts(value);
            if (dt.isValid()) {
                return { value };
            } else {
                return { errors: helpers.error('any.invalid') };
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
                    },
                ],
                validate(value, helpers, args) {
                    const date = fromDateParts(value);

                    if (date.isValid() && date.isSameOrAfter(args.min)) {
                        return value;
                    } else {
                        return helpers.error('dateParts.minDate', {
                            min: args.min,
                        });
                    }
                },
            },
            maxDate: {
                method(max) {
                    return this.$_addRule({
                        name: 'maxDate',
                        args: { max },
                    });
                },
                args: [
                    {
                        name: 'max',
                        assert: joi.string().required(),
                    },
                ],
                validate(value, helpers, args) {
                    const date = fromDateParts(value);

                    if (date.isValid() && date.isSameOrBefore(args.max)) {
                        return value;
                    } else {
                        return helpers.error('dateParts.maxDate', {
                            max: args.max,
                        });
                    }
                },
            },
            minDateRef: {
                method(referenceValue) {
                    return this.$_addRule({
                        name: 'minDateRef',
                        args: { referenceValue },
                    });
                },
                args: [
                    {
                        name: 'referenceValue',
                        ref: true, // Expand references
                        assert: datePartsSchema,
                    },
                ],
                validate(value, helpers, args) {
                    const date = fromDateParts(value);
                    const referenceDate = args.referenceValue
                        ? fromDateParts(args.referenceValue)
                        : null;

                    if (
                        referenceDate &&
                        date.isValid() &&
                        date.isSameOrAfter(referenceDate)
                    ) {
                        return value;
                    } else {
                        return helpers.error('dateParts.minDateRef');
                    }
                },
            },
            rangeLimit: {
                method(referenceValue, limit) {
                    return this.$_addRule({
                        name: 'rangeLimit',
                        args: { referenceValue, limit },
                    });
                },
                args: [
                    {
                        name: 'referenceValue',
                        ref: true, // Expand references
                        assert: datePartsSchema,
                    },
                    {
                        name: 'limit',
                        assert: joi.object({
                            amount: joi.number().required(),
                            unit: joi.string().required(),
                        }),
                    },
                ],
                validate(value, helpers, args) {
                    const date = fromDateParts(value);
                    const refDate = args.referenceValue
                        ? fromDateParts(args.referenceValue)
                        : moment();

                    const limitDate = refDate
                        .clone()
                        .add(args.limit.amount, args.limit.unit);

                    if (date.isValid() && date.isSameOrBefore(limitDate)) {
                        return value;
                    } else {
                        return helpers.error('dateParts.rangeLimit', {
                            limit: args.limit,
                        });
                    }
                },
            },
        },
    };
};
