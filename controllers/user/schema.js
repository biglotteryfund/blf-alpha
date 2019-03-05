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
    errorMessages: {
        username: {
            base: { en: 'Enter a valid email address', cy: '' }
        },
        password: {
            base: { en: 'Password must be at least 10 characters long', cy: '' }
        }
    }
};
