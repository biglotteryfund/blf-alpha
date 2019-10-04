'use strict';
const baseJoi = require('@hapi/joi16');
const Joi = baseJoi.extend(require('./password-strength'));

const MIN_PASSWORD_LENGTH = 10;
const MIN_PASSWORD_STRENGTH = 2;

const username = Joi.string()
    .email()
    .required();

const passwordSchema = Joi.password()
    .min(MIN_PASSWORD_LENGTH) // Min characters
    .invalid(Joi.ref('username')) // Must not equal username
    .strength(MIN_PASSWORD_STRENGTH) // Must have a strength greater than minimum score
    .required();

const passwordConfirmationSchema = Joi.string()
    .valid(Joi.ref('password')) // Must match password
    .required();

function getTranslations(i18n) {
    return function(path, ...params) {
        return i18n && i18n.__(`user.validationMessages.${path}`, ...params);
    };
}

module.exports = {
    emailOnly(i18n) {
        const messageForLocale = getTranslations(i18n);
        return {
            schema: Joi.object({
                username: username
            }),
            messages: {
                username: [
                    {
                        type: 'base',
                        message: messageForLocale('emailInvalid')
                    }
                ]
            }
        };
    },

    newAccounts(i18n) {
        const messageForLocale = getTranslations(i18n);

        return {
            schema: Joi.object({
                username: username,
                password: passwordSchema,
                passwordConfirmation: passwordConfirmationSchema
            }),
            messages: {
                username: [
                    {
                        type: 'base',
                        message: messageForLocale('emailInvalid')
                    }
                ],
                password: [
                    {
                        type: 'base',
                        message: messageForLocale('passwordRequired')
                    },
                    {
                        type: 'any.invalid',
                        message: messageForLocale('passwordMatchesEmail')
                    },
                    {
                        type: 'string.min',
                        message: messageForLocale(
                            'passwordLength',
                            MIN_PASSWORD_LENGTH,
                            'you fool'
                        )
                    },
                    {
                        type: 'password.common',
                        message: messageForLocale('passwordStrength')
                    },
                    {
                        type: 'password.strength',
                        message: messageForLocale('passwordStrength')
                    }
                ],
                passwordConfirmation: [
                    {
                        type: 'base',
                        message: messageForLocale('passwordConfirmation')
                    }
                ]
            }
        };
    },

    passwordReset(i18n) {
        const messageForLocale = getTranslations(i18n);
        return {
            schema: Joi.object({
                oldPassword: Joi.when(Joi.ref('token'), {
                    is: Joi.exist(),
                    then: Joi.any().strip(),
                    otherwise: Joi.string().required()
                }),
                password: passwordSchema,
                passwordConfirmation: passwordConfirmationSchema
            }),
            messages: {
                oldPassword: [
                    {
                        type: 'base',
                        message: messageForLocale('oldPasswordRequired')
                    }
                ],
                password: [
                    {
                        type: 'base',
                        message: messageForLocale('passwordRequired')
                    },
                    {
                        type: 'any.invalid',
                        message: messageForLocale('passwordMatchesEmail')
                    },
                    {
                        type: 'string.min',
                        message: messageForLocale(
                            'passwordLength',
                            MIN_PASSWORD_LENGTH
                        )
                    },
                    {
                        type: 'password.common',
                        message: messageForLocale('passwordStrength')
                    },
                    {
                        type: 'password.strength',
                        message: messageForLocale('passwordStrength')
                    }
                ],
                passwordConfirmation: [
                    {
                        type: 'base',
                        message: messageForLocale('passwordConfirmation')
                    }
                ]
            }
        };
    }
};
