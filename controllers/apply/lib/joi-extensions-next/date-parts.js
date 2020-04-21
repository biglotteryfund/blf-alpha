'use strict';
// const moment = require('moment');
const fromDateParts = require('../from-date-parts');

/**
 * @TODO: Add minDateRef and rangeLimit rules. Need tests first.
 */
module.exports = function dateParts(joi) {
    return {
        type: 'dateParts',
        base: joi.object({
            day: joi.number().integer().required(),
            month: joi.number().integer().required(),
            year: joi.number().integer().required(),
        }),
        messages: {
            'dateParts.minDate': 'Date must be on or after {{#min}}',
            'dateParts.minDateRef':
                'Date from must be on or after referenced date',
            'dateParts.maxDate': 'Date must be on or before {{#max}}',
            'dateParts.rangeLimit': 'Date must be within range',
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
        },
    };
};
