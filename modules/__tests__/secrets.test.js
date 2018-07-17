/* eslint-env jest */
'use strict';

const { getSecretFromRawParameters } = require('../secrets');

describe('Get secrets', () => {
    const mockParameters = [
        {
            Name: 'some.parameter',
            Type: 'SecureString',
            Value: 'some-value',
            Version: 1
        },
        {
            Name: 'content-api.url',
            Type: 'SecureString',
            Value: 'https://content-api.example.com',
            Version: 3
        }
    ];

    it('should get secret for a given property', () => {
        expect(getSecretFromRawParameters(mockParameters, 'some.parameter')).toBe('some-value');
    });

    it('should throw an error for unknown properties', () => {
        expect(() => getSecretFromRawParameters(mockParameters, 'does.not.exist')).toThrowError(
            'Could not find property does.not.exist in secrets'
        );
    });
});
