'use strict';
const postcode = require('postcode');

module.exports = function(joi) {
    return {
        base: joi.string(),
        name: 'string',
        language: {
            postcode: 'did not seem to be a valid postcode'
        },
        rules: [
            {
                name: 'postcode',
                validate(_params, value, state, options) {
                    if (postcode.isValid(value)) {
                        return value;
                    } else {
                        return this.createError(
                            'string.postcode',
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
