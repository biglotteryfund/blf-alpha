/* eslint-env jest */
'use strict';
const sample = require('lodash/sample');
const commonPasswords = require('./common-passwords');
const { newAccounts } = require('./account-schemas');
const validateSchema = require('./validate-schema');

describe('account schemas', () => {
    test('new accounts', () => {
        const username = 'example@example.com';
        const commonPassword = sample(commonPasswords);
        const weakPassword = 'password321';

        expect(
            validateSchema(newAccounts('en'), {
                username: username,
                password: username,
                passwordConfirmation: username
            }).messages
        ).toEqual([
            {
                param: 'password',
                type: 'any.invalid',
                msg: expect.stringContaining(
                    'Password can not be the same as your username.'
                )
            }
        ]);

        expect(
            validateSchema(newAccounts('en'), {
                username: username,
                password: commonPassword,
                passwordConfirmation: commonPassword
            }).messages
        ).toEqual([
            {
                param: 'password',
                type: 'password.common',
                msg: expect.stringContaining('Password is too weak')
            }
        ]);

        expect(
            validateSchema(newAccounts('en'), {
                username: username,
                password: weakPassword,
                passwordConfirmation: weakPassword
            }).messages
        ).toEqual([
            {
                param: 'password',
                type: 'password.strength',
                msg: expect.stringContaining('Password is too weak')
            }
        ]);
    });
});
