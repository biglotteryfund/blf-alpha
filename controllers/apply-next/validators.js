'use strict';
const moment = require('moment');
const baseJoi = require('joi');
const { toInteger, isObject } = require('lodash');
const { POSTCODE_REGEX } = require('../../modules/postcodes');

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
        .trim()
        .regex(POSTCODE_REGEX)
        .description('postcode'),
    futureDate: function({ amount = null, unit = null } = {}) {
        let minDate = 'now';
        if (amount && unit) {
            moment()
                .add(amount, unit)
                .format('YYYY-MM-DD');
        }

        return Joi.dateObject()
            .iso()
            .min(minDate);
    },
    dateOfBirth: function(minAge) {
        const maxDate = moment()
            .subtract(minAge, 'years')
            .format('YYYY-MM-DD');

        return Joi.dateObject()
            .iso()
            .max(maxDate);
    }
};
