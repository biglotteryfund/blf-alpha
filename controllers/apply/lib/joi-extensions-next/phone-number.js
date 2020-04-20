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
        type: 'string',
        base: joi.string(),
        messages: {
            'string.phonenumber': 'did not seem to be a phone number',
        },
        rules: {
            phoneNumber: {
                method() {
                    return this.$_addRule('phoneNumber');
                },
                validate(value, helpers) {
                    try {
                        const parsedValue = phoneUtil.parse(value, 'GB');
                        if (phoneUtil.isValidNumber(parsedValue)) {
                            if (helpers.prefs.convert) {
                                return phoneUtil.format(
                                    parsedValue,
                                    PhoneNumberFormat.NATIONAL
                                );
                            } else {
                                return value;
                            }
                        } else {
                            return helpers.error('string.phonenumber');
                        }
                    } catch (err) {
                        return helpers.error('string.phonenumber');
                    }
                },
            },
        },
    };
};
