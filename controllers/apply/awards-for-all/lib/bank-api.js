'use strict';
const request = require('request-promise-native');
const { BANK_API } = require('../../../../common/secrets');

function normaliseResultCode(resultCode) {
    let result;
    switch (resultCode) {
        case '01':
            result = 'VALID';
            break;
        case '02':
            result = 'INVALID';
            break;
        default:
            result = 'UNKNOWN';
            break;
    }

    return result;
}

function normaliseBacsCheck(accountProperties) {
    // Coerce a string ("true") into a boolean
    return accountProperties ? !!accountProperties.bacs_credit : false;
}

module.exports = function checkBankAccountDetails(sortCode, accountNumber) {
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
        .then(response => {
            return {
                code: normaliseResultCode(response.resultCode),
                originalCode: response.resultCode,
                supportsBacsPayment: normaliseBacsCheck(
                    response.accountProperties
                )
            };
        });
};
