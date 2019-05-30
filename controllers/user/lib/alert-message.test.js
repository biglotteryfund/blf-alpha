/* eslint-env jest */
'use strict';
const alertMessage = require('./alert-message');

describe('alertMessage', () => {
    test('should return alert message based on status', () => {
        expect(
            alertMessage({
                locale: 'en',
                status: 'passwordUpdated'
            })
        ).toBe('Your password was successfully updated!');

        expect(
            alertMessage({
                locale: 'en',
                status: 'activationSent',
                username: 'example@example.com'
            })
        ).toBe(
            'We have sent an email to example@example.com with a link to activate your account.'
        );
    });
});
