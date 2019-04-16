'use strict';
const Joi = require('joi');

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
    errorMessages: {
        username: [
            {
                type: 'base',
                message: { en: 'Enter a valid email address', cy: '' }
            }
        ],
        password: [
            {
                type: 'base',
                message: { en: 'Enter a password', cy: '' }
            },
            {
                type: 'any.invalid',
                message: { en: 'Password is invalid, check it is not the same as your username', cy: '' }
            },
            {
                type: 'string.min',
                message: { en: 'Password must be at least 10 characters long', cy: '' }
            }
        ]
    }
};
