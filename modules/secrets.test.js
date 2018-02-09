'use strict';
/* eslint-env mocha*/
const chai = require('chai');
const expect = chai.expect;

const { getSecretFromRawParamters } = require('./secrets');

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
        expect(getSecretFromRawParamters(mockParameters, 'some.parameter')).to.equal('some-value');
    });

    it('should throw an error for unknown properties', () => {
        expect(() => getSecretFromRawParamters(mockParameters, 'does.not.exist')).to.throw(
            'Could not find property does.not.exist in secrets'
        );
    });
});
