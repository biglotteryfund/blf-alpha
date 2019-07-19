'use strict';
const get = require('lodash/fp/get');
const baseJoi = require('@hapi/joi');
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

const MESSAGES = {
    emailInvalid(locale) {
        return get(locale)({
            en: 'Enter a valid email address',
            cy: ''
        });
    },
    oldPasswordRequired(locale) {
        return get(locale)({
            en: 'Enter your current password',
            cy: ''
        });
    },
    passwordRequired(locale) {
        return get(locale)({
            en: `Enter a password`,
            cy: ''
        });
    },
    passwordInvalid(locale) {
        return get(locale)({
            en: `Password can not be the same as your username.`,
            cy: ''
        });
    },
    passwordLength(locale) {
        return get(locale)({
            en: `Password must be at least ${MIN_PASSWORD_LENGTH} characters long`,
            cy: ''
        });
    },
    passwordStrength(locale) {
        return get(locale)({
            en: `Password is too weak, please try another password`,
            cy: ''
        });
    },
    passwordConfirmation(locale) {
        return get(locale)({
            en: 'Passwords must match'
        });
    }
};

module.exports = {
    emailOnly(locale) {
        return {
            schema: Joi.object({
                username: username
            }),
            messages: {
                username: [
                    { type: 'base', message: MESSAGES.emailInvalid(locale) }
                ]
            }
        };
    },

    newAccounts(locale) {
        return {
            schema: Joi.object({
                username: username,
                password: passwordSchema,
                passwordConfirmation: passwordConfirmationSchema
            }),
            messages: {
                username: [
                    { type: 'base', message: MESSAGES.emailInvalid(locale) }
                ],
                password: [
                    {
                        type: 'base',
                        message: MESSAGES.passwordRequired(locale)
                    },
                    {
                        type: 'any.invalid',
                        message: MESSAGES.passwordInvalid(locale)
                    },
                    {
                        type: 'string.min',
                        message: MESSAGES.passwordLength(locale)
                    },
                    {
                        type: 'password.common',
                        message: MESSAGES.passwordStrength(locale)
                    },
                    {
                        type: 'password.strength',
                        message: MESSAGES.passwordStrength(locale)
                    }
                ],
                passwordConfirmation: [
                    {
                        type: 'base',
                        message: MESSAGES.passwordConfirmation(locale)
                    }
                ]
            }
        };
    },

    passwordReset(locale) {
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
                        message: MESSAGES.oldPasswordRequired(locale)
                    }
                ],
                password: [
                    {
                        type: 'base',
                        message: MESSAGES.passwordRequired(locale)
                    },
                    {
                        type: 'any.invalid',
                        message: MESSAGES.passwordInvalid(locale)
                    },
                    {
                        type: 'string.min',
                        message: MESSAGES.passwordLength(locale)
                    }
                ],
                passwordConfirmation: [
                    {
                        type: 'base',
                        message: MESSAGES.passwordConfirmation(locale)
                    }
                ]
            }
        };
    }
};
