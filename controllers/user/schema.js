'use strict';
const Joi = require('@hapi/joi');
const { get } = require('lodash/fp');

const username = Joi.string()
    .email()
    .required();

module.exports = {
    username,
    accountSchema: Joi.object({
        username: username,
        password: Joi.string()
            .min(10) // Min 10 characters
            .invalid(Joi.ref('username')) // Must not equal username
            .required()
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
