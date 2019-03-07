'use strict';
const moment = require('moment');
const baseJoi = require('joi');
const { toInteger, isObject } = require('lodash');

const Joi = baseJoi.extend(joi => ({
    base: joi.date(),
    name: 'dateObject',
    coerce: function(value, state, options) {
        if (isObject(value)) {
            const date = moment({
                year: toInteger(value.year),
                // month is 0 indexed when constructing a date object
                month: toInteger(value.month) - 1,
                day: toInteger(value.day)
            });

            if (date.isValid()) {
                return date.toISOString();
            } else {
                return this.createError('date.isoDate', { v: value }, state, options);
            }
        } else {
            return value;
        }
    }
}));

module.exports = {
    Joi,
    postcode: Joi.string()
        // via https://github.com/chriso/validator.js/blob/master/lib/isPostalCode.js#L54
        .regex(/^(gir\s?0aa|[a-z]{1,2}\d[\da-z]?\s?(\d[a-z]{2})?)$/i)
        .description('postcode'),
    futureDate: function(amount, unit) {
        const minDate = moment()
            .add(amount, unit)
            .format('YYYY-MM-DD');

        return Joi.dateObject()
            .iso()
            .min(minDate);
    },
    dateOfBirth: function(minAge) {
        const maxDate = moment()
            .subtract(minAge, 'years')
            .format('YYYY-MM-DD');

        return Joi.date().max(maxDate);
    }
};
