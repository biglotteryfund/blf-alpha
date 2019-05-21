'use strict';
const { toInteger } = require('lodash');
const moment = require('moment');

// @TODO Could dateParts and dayMonth be merged with options?
module.exports = function dayMonth(joi) {
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
