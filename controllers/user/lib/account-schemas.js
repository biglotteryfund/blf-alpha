'use strict';
const Joi = require('@hapi/joi');
const { get } = require('lodash/fp');

const username = Joi.string()
    .email()
    .required();

const MIN_PASSWORD_LENGTH = 12;

const passwordSchema = Joi.string()
    .min(MIN_PASSWORD_LENGTH) // Min characters
    // .invalid(Joi.ref('username')) // Must not equal username
    .required();

const passwordConfirmationSchema = Joi.string()
    .valid(Joi.ref('password')) // Must match password
    .required();

const MESSAGES = {
    validEmail(locale) {
        return get(locale)({
            en: 'Enter a valid email address',
            cy: ''
        });
    },
    requiredPassword(locale) {
        return get(locale)({
            en: `Password is invalid, check it is not the same as your username`,
            cy: ''
        });
    }
};

module.exports = {
    username,
    newAccounts(locale) {
        const localise = get(locale);
        return {
            schema: Joi.object({
                username: username,
                password: passwordSchema,
                passwordConfirmation: passwordConfirmationSchema
            }),
            messages: {
                username: [
                    { type: 'base', message: MESSAGES.validEmail(locale) }
                ],
                password: [
                    {
                        type: 'base',
                        message: MESSAGES.requiredPassword(locale)
                    },
                    {
                        type: 'any.invalid',
                        message: localise({
                            en: `Password is invalid, check it is not the same as your username`,
                            cy: ''
                        })
                    },
                    {
                        type: 'string.min',
                        message: localise({
                            en: `Password must be at least ${MIN_PASSWORD_LENGTH} characters long`,
                            cy: ''
                        })
                    }
                ],
                passwordConfirmation: [
                    {
                        type: 'base',
                        message: localise({
                            en: 'Passwords must match'
                        })
                    }
                ]
            }
        };
    },
    accountSchema: Joi.object({
        username: username,
        password: passwordSchema
    }),
    emailSchema: Joi.object({
        username: username
    }),
    errorMessages(locale) {
        const localise = get(locale);
        return {
            username: [
                {
                    type: 'base',
                    message: localise({
                        en: 'Enter a valid email address',
                        cy: ''
                    })
                }
            ],
            password: [
                {
                    type: 'base',
                    message: localise({ en: 'Enter a password', cy: '' })
                },
                {
                    type: 'any.invalid',
                    message: localise({
                        en: `Password is invalid, check it is not the same as your username`,
                        cy: ''
                    })
                },
                {
                    type: 'string.min',
                    message: localise({
                        en: 'Password must be at least 10 characters long',
                        cy: ''
                    })
                }
            ]
        };
    }
};
