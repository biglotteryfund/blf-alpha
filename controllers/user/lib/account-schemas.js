'use strict';
const fs = require('fs');
const path = require('path');
const get = require('lodash/fp/get');
const Joi = require('@hapi/joi');

/**
 * List of the most commonly used passwords. Specifically to 10k, filtered by min-length
 * awk 'length($0)>9' full-list.txt > common-passwords.txt
 * @see https://github.com/danielmiessler/SecLists/tree/master/Passwords/Common-Credentials
 */
const commonPasswords = fs
    .readFileSync(path.resolve(__dirname, './common-passwords.txt'), 'utf8')
    .toString()
    .split('\n');

const MIN_PASSWORD_LENGTH = 10;

const username = Joi.string()
    .email()
    .required();

const passwordSchema = Joi.string()
    .min(MIN_PASSWORD_LENGTH) // Min characters
    .invalid(Joi.ref('username')) // Must not equal username
    .invalid(commonPasswords) // Must not be in common passwords list
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
            en: `Your password could be too common, or is the same as your username.`,
            cy: ''
        });
    },
    passwordLength(locale) {
        return get(locale)({
            en: `Password must be at least ${MIN_PASSWORD_LENGTH} characters long`,
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
