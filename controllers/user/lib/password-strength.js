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
        type: 'password',
        base: joi.string(),
        messages: {
            'password.common': `password is too common`,
            'password.strength': `password must have a strength of at least {{#minScore}}`
        },
        rules: {
            strength: {
                method(minScore) {
                    return this.$_addRule({ name: 'strength', args: { minScore } });
                },
                args: [
                    {
                        name: 'minScore',
                        ref: true,
                        assert: joi.number().required(),
                        message: 'must be a number'
                    }
                ],
                validate(value, helpers, args) {
                    if (commonPasswords.includes(value)) {
                        return helpers.error('password.common');
                    } else if (zxcvbn(value).score < args.minScore) {
                        return helpers.error('password.strength', { minScore: args.minScore });
                    } else {
                        return value;
                    }
                }
            }
        }
    };
};
