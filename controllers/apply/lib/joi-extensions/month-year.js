'use strict';
const toInteger = require('lodash/toInteger');
const moment = require('moment');

function valueToDate(value) {
    return moment({
        year: toInteger(value.year),
        month: toInteger(value.month) - 1,
        day: 1,
    });
}

module.exports = function (joi) {
    return {
        type: 'monthYear',
        base: joi.object({
            month: joi.number().integer().required(),
            year: joi.number().integer().min(1000).required(),
        }),
        messages: {
            'monthYear.pastDate': 'must be in the past',
        },
        validate(value, helpers) {
            const date = valueToDate(value);
            if (date.isValid()) {
                return { value };
            } else {
                return { errors: helpers.error('any.invalid') };
            }
        },
        rules: {
            pastDate: {
                method() {
                    return this.$_addRule('pastDate');
                },
                validate(value, helpers) {
                    const now = moment();
                    const date = valueToDate(value);
                    if (date.isValid() && date.isSameOrBefore(now)) {
                        return value;
                    } else {
                        return helpers.error('monthYear.pastDate');
                    }
                },
            },
            minTimeAgo: {
                method(amount, unit) {
                    return this.$_addRule({
                        name: 'minTimeAgo',
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
                validate(value, _helpers, args) {
                    const minDate = moment().subtract(args.amount, args.units);
                    value.isBeforeMin = valueToDate(value).isSameOrBefore(
                        minDate
                    );
                    return value;
                },
            },
        },
    };
};
