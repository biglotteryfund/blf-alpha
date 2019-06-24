'use strict';
const { toInteger } = require('lodash');
const moment = require('moment');

const valueToDate = value => {
    return moment({
        year: toInteger(value.year),
        month: toInteger(value.month) - 1,
        day: 1
    });
};

// @TODO Could dateParts and dayMonth be merged with options?
module.exports = function monthYear(joi) {
    return {
        name: 'monthYear',
        base: joi.object({
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
            const date = valueToDate(value);
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
                name: 'pastDate',
                validate(params, value, state, options) {
                    const now = moment();
                    const date = valueToDate(value);
                    if (date.isValid() && date.isSameOrBefore(now)) {
                        value.lol = true;
                        return value;
                    } else {
                        return this.createError(
                            'monthYear.pastDate',
                            { v: value },
                            state,
                            options
                        );
                    }
                }
            },
            {
                name: 'minTimeAgo',
                params: {
                    amount: joi.number().required(),
                    units: joi.string().required()
                },
                /* eslint-disable-next-line no-unused-vars */
                validate(params, value, state, options) {
                    const minDate = moment().subtract(
                        params.amount,
                        params.units
                    );
                    const isBeforeMin = valueToDate(value).isSameOrBefore(
                        minDate
                    );
                    value.isBeforeMin = isBeforeMin;
                    return value;
                }
            }
        ]
    };
};
