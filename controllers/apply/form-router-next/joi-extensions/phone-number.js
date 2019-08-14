'use strict';

const { PhoneNumberUtil, PhoneNumberFormat } = require('google-libphonenumber');
const phoneUtil = PhoneNumberUtil.getInstance();

/**
 * Allows you to do `Joi.string().phoneNumber()`
 *
 * @param {Object} joi Joi instance
 * @return {Object} Joi plugin object
 */
module.exports = function phoneNumber(joi) {
    return {
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
                        const parsedValue = phoneUtil.parse(value, 'GB');
                        if (phoneUtil.isValidNumber(parsedValue)) {
                            if (options.convert) {
                                return phoneUtil.format(
                                    parsedValue,
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
    };
};
