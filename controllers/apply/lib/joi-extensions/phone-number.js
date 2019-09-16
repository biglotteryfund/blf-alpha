'use strict';

const { PhoneNumberUtil, PhoneNumberFormat } = require('google-libphonenumber');
const phoneUtil = PhoneNumberUtil.getInstance();

module.exports = function(joi) {
    return {
        base: joi.string(),
        type: 'phone',
        messages: {
            'phonenumber.invalid': 'did not seem to be a phone number'
        },
        validate(value, helpers) {
            try {
                const parsedValue = phoneUtil.parse(value, 'GB');
                if (phoneUtil.isValidNumber(parsedValue)) {
                    return {
                        value: phoneUtil.format(
                            parsedValue,
                            PhoneNumberFormat.NATIONAL
                        )
                    };
                } else {
                    return {
                        value,
                        errors: helpers.error('phonenumber.invalid')
                    };
                }
            } catch (err) {
                return { value, errors: helpers.error('phonenumber.invalid') };
            }
        }
    };
};
