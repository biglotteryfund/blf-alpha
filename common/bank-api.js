'use strict';
const request = require('request-promise-native');
const { BANK_API } = require('../common/secrets');

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
            let responseStatus;
            switch (response.resultCode) {
                case '01':
                    responseStatus = 'BANK_DETAILS_VALID';
                    break;
                case '02':
                    responseStatus = 'BANK_DETAILS_INVALID';
                    break;
                default:
                    responseStatus = 'UNKNOWN';
                    break;
            }

            // Coerce a string ("true") into a boolean
            const supportsBacsPayment = response.accountProperties
                ? !!response.accountProperties.bacs_credit
                : false;

            return {
                code: responseStatus,
                originalCode: response.resultCode,
                supportsBacsPayment: supportsBacsPayment
            };
        });
};
