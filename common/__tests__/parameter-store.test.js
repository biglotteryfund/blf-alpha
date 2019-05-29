/* eslint-env jest */
'use strict';

const { getSecretFromRawParameters } = require('../parameter-store');

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

    it('should return undefined for unknown values', () => {
        expect(getSecretFromRawParameters(mockParameters, 'does.not.exist')).toBe(undefined);
    });

    it('should throw an error for unknown properties when shouldThrowIfMissing is true', () => {
        expect(() => getSecretFromRawParameters(mockParameters, 'does.not.exist', true)).toThrowError(
            'Secret missing: does.not.exist'
        );
    });
});
