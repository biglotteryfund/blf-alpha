'use strict';
const { isString } = require('lodash');

module.exports = function bankNumbers(joi) {
    return {
        name: 'bankNumbers',
        base: joi.string(),
        /* eslint-disable-next-line no-unused-vars */
        coerce(value, state, options) {
            if (isString(value)) {
                // Strip out any non-numeric characters (eg. -)
                return value.replace(/\D/g, '');
            }
            return value;
        },
        rules: [
            {
                name: 'sortCode',
                params: {
                    requiredLength: joi.number().required()
                },
                validate(params, value, state, options) {
                    const codeLength = value.toString().length;
                    if (codeLength !== params.requiredLength) {
                        return this.createError(
                            'sortCode.wrongSize',
                            { v: value },
                            state,
                            options
                        );
                    }
                    return value;
                }
            },
            {
                name: 'accountNumber',
                params: {
                    requiredLength: joi.number().required()
                },
                validate(params, value, state, options) {
                    const codeLength = value.toString().length;
                    if (codeLength !== params.requiredLength) {
                        return this.createError(
                            'accountNumber.wrongSize',
                            { v: value },
                            state,
                            options
                        );
                    }
                    return value;
                }
            }
        ]
    };
};
