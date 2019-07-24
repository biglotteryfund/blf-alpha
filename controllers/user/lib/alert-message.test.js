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
    });
});
