'use strict';

const libphonenumber = require('google-libphonenumber');
const PhoneUtil = libphonenumber.PhoneNumberUtil.getInstance();
const PhoneNumberFormat = libphonenumber.PhoneNumberFormat;

const internals = {};

/**
 * Allows you to do `Joi.string().phoneNumber()`
 *
 * @param {Object} joi Joi instance provided by Joi
 * @return {Object} Joi plugin object
 */
module.exports = joi => ({
    base: joi.string(),
    name: 'string',
    language: {
        phonenumber: 'did not seem to be a phone number'
    },
    rules: [
        {
            name: 'phoneNumber',
            validate(params, value, state, options) {
                try {
                    const proto = internals.parse(value, ['GB']);

                    if (PhoneUtil.isValidNumber(proto)) {
                        if (options.convert) {
                            return PhoneUtil.format(
                                proto,
                                PhoneNumberFormat.NATIONAL
                            );
                        } else {
                            return value;
                        }
                    } else {
                        return this.createError(
                            'string.phonenumber',
                            { value },
                            state,
                            options
                        );
                    }
                } catch (err) {
                    return this.createError(
                        'string.phonenumber',
                        { value },
                        state,
                        options
                    );
                }
            }
        }
    ]
});

/**
 *
 * @param {String} value input
 * @param {Array<String>} countries countries to try and parse with
 * @returns {Object} parse result
 *
 * @throws {Error} throws when input isn't valid
 */
internals.parse = (value, [...countries] = []) => {
    const country = countries.shift();
    try {
        return PhoneUtil.parse(value, country);
    } catch (error) {
        if (countries.length > 0) {
            return internals.parse(value, countries);
        }

        throw error;
    }
};
