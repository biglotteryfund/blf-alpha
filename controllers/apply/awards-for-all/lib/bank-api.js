'use strict';
const got = require('got');
const { BANK_API } = require('../../../../common/secrets');

function checkBankAccountDetails(sortCode, accountNumber) {
    return got
        .get('https://www.bankaccountchecker.com/listener.php', {
            searchParams: {
                key: BANK_API.KEY,
                password: BANK_API.PASSWORD,
                output: 'json',
                type: 'uk_bankaccount',
                sortcode: sortCode,
                bankaccount: accountNumber
            }
        })
        .json()
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
