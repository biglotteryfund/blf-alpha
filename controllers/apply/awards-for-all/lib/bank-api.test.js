/* eslint-env jest */
'use strict';

const { normalizeResponse } = require('./bank-api');

test('should normalise valid response', () => {
    const mockValidResponse = {
        resultCode: '01',
        resultDescription: 'Sortcode and Bank Account are valid',
        accountProperties: {
            institution: 'TSB BANK PLC',
            branch: '160/2 HIGH ST ACTON 308087',
            fast_payment: 'true',
            bacs_credit: 'true',
            bacs_direct_debit: 'true',
            chaps: 'true',
            cheque: 'false'
        }
    };

    expect(normalizeResponse(mockValidResponse)).toEqual({
        code: 'VALID',
        originalCode: '01',
        supportsBacsPayment: true
    });
});

test('should normalise invalid response', () => {
    const mockInvalidResponse = {
        resultCode: '02',
        resultDescription: 'Sortcode and Bank Account are not valid'
    };

    expect(normalizeResponse(mockInvalidResponse)).toEqual({
        code: 'INVALID',
        originalCode: '02',
        supportsBacsPayment: false
    });
});

test('should throw an error for bad response', () => {
    const mockBadResponse = {
        resultCode: '05',
        resultDescription: 'Key and/or password are invalid.'
    };

    expect(() => normalizeResponse(mockBadResponse)).toThrow(mockBadResponse.resultDescription);
});
