'use strict';
const zxcvbn = require('zxcvbn');

const commonPasswords = require('./common-passwords');
/**
 * Password validation
 * - Checks value against commonPasswords
 * - Checks value using zxcvbn based on minimum score
 */
module.exports = function password(joi) {
    return {
        base: joi.string(),
        name: 'password',
        language: {
            common: `password is too common`,
            strength: `password must have a strength of at least {{minScore}}`
        },
        rules: [
            {
                name: 'strength',
                params: {
                    minScore: joi.number().required()
                },
                validate(params, value, state, options) {
                    if (commonPasswords.includes(value)) {
                        return this.createError(
                            'password.common',
                            { value },
                            state,
                            options
                        );
                    } else if (zxcvbn(value).score < params.minScore) {
                        return this.createError(
                            'password.strength',
                            { value, minScore: params.minScore },
                            state,
                            options
                        );
                    } else {
                        return value;
                    }
                }
            }
        ]
    };
};
