/* eslint-env jest */
'use strict';
const { newAccounts } = require('./account-schemas');
const validateSchema = require('./validate-schema');

describe('account schemas', () => {
    test('new accounts', () => {
        const username = 'example@example.com';
        const commonPassword = 'qwertyuiop';
        const weakPassword = 'password321';

        expect(
            validateSchema(newAccounts(), {
                username: username,
                password: username,
                passwordConfirmation: username
            }).messages
        ).toEqual([
            {
                param: 'password',
                type: 'any.invalid'
            }
        ]);

        expect(
            validateSchema(newAccounts(), {
                username: username,
                password: commonPassword,
                passwordConfirmation: commonPassword
            }).messages
        ).toEqual([
            {
                param: 'password',
                type: 'password.common'
            }
        ]);

        expect(
            validateSchema(newAccounts(), {
                username: username,
                password: weakPassword,
                passwordConfirmation: weakPassword
            }).messages
        ).toEqual([
            {
                param: 'password',
                type: 'password.strength'
            }
        ]);
    });
});
