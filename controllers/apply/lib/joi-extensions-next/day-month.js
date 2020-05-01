'use strict';
const toInteger = require('lodash/toInteger');
const moment = require('moment');

module.exports = function dayMonth(joi) {
    return {
        type: 'dayMonth',
        base: joi.object({
            day: joi.number().integer().required(),
            month: joi.number().integer().required(),
        }),
        validate(value, helpers) {
            const date = moment({
                year: moment().year(),
                month: toInteger(value.month) - 1,
                day: toInteger(value.day),
            });

            if (date.isValid()) {
                return { value };
            } else {
                return { errors: helpers.error('any.invalid') };
            }
        },
    };
};
