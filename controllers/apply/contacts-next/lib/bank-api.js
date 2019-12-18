'use strict';
const request = require('request-promise-native');
const { BANK_API } = require('../../../../common/secrets');

function checkBankAccountDetails(sortCode, accountNumber) {
    return request
        .get({
            uri: 'https://www.bankaccountchecker.com/listener.php',
            qs: {
                key: BANK_API.KEY,
                password: BANK_API.PASSWORD,
                output: 'json',
                type: 'uk_bankaccount',
                sortcode: sortCode,
                bankaccount: accountNumber
            },
            json: true
        })
        .then(normalizeResponse);
}

function normalizeResponse(response) {
    switch (response.resultCode) {
        case '01':
            return {
                code:
                    response.accountProperties.bacs_credit === 'true'
                        ? 'VALID'
                        : 'INVALID_BACS'
            };
        case '02':
            return {
                code: 'INVALID_ACCOUNT'
            };
        default:
            throw new Error(response.resultDescription);
    }
}

module.exports = {
    checkBankAccountDetails,
    normalizeResponse
};
