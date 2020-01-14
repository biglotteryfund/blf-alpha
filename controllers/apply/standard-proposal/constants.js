'use strict';

const EXPIRY_EMAIL_REMINDERS = [
    {
        emailType: 'STANDARD_ONE_MONTH',
        sendBeforeExpiry: {
            amount: 30,
            unit: 'days'
        }
    },
    {
        emailType: 'STANDARD_ONE_WEEK',
        sendBeforeExpiry: {
            amount: 14,
            unit: 'days'
        }
    },
    {
        emailType: 'STANDARD_ONE_DAY',
        sendBeforeExpiry: {
            amount: 1,
            unit: 'days'
        }
    }
];

module.exports = {
    EXPIRY_EMAIL_REMINDERS
};
