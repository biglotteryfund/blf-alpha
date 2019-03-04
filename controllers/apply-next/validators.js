'use strict';
const Joi = require('joi');
const moment = require('moment');

module.exports = {
    postcode: Joi.string()
        // via https://github.com/chriso/validator.js/blob/master/lib/isPostalCode.js#L54
        .regex(/^(gir\s?0aa|[a-z]{1,2}\d[\da-z]?\s?(\d[a-z]{2})?)$/i)
        .description('postcode'),
    futureDate: function(amount, unit) {
        const minDate = moment()
            .add(amount, unit)
            .format('YYYY-MM-DD');

        return Joi.date().min(minDate);
    },
    dateOfBirth: function(minAge) {
        const maxDate = moment()
            .subtract(minAge, 'years')
            .format('YYYY-MM-DD');

        return Joi.date().max(maxDate);
    }
};
