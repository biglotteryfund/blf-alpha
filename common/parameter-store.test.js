/* eslint-env jest */
'use strict';

const { getFromRawParameters } = require('./parameter-store');

function mockParameters() {
    return [
        { Name: 'some.parameter', Value: 'some-value' },
        { Name: 'another.parameter', Value: 'another-value' }
    ];
}

test('should get parameter by key', () => {
    expect(getFromRawParameters(mockParameters(), 'some.parameter')).toBe(
        'some-value'
    );
});

test('should return undefined for unknown values', () => {
    expect(getFromRawParameters(mockParameters(), 'does.not.exist')).toBe(
        undefined
    );
});

test('should throw an error when shouldThrowIfMissing is true', () => {
    expect(() =>
        getFromRawParameters(mockParameters(), 'does.not.exist', true)
    ).toThrowError('parameter missing: does.not.exist');
});
