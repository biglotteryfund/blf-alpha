/* eslint-env jest */
'use strict';
const generateExpiryQueue = require('./generate-expiry-queue');

test('generate email queue items', function() {
    const applicationMeta = {
        id: 'MOCK_APPLICATION_ID',
        userId: 123,
        expiresAt: '2040-05-06T12:01:00.000Z'
    };

    const expiryEmailPeriods = [
        {
            emailType: 'ONE_MONTH',
            sendBeforeExpiry: { amount: 30, unit: 'days' }
        },
        {
            emailType: 'ONE_WEEK',
            sendBeforeExpiry: { amount: 7, unit: 'days' }
        },
        {
            emailType: 'ONE_DAY',
            sendBeforeExpiry: { amount: 1, unit: 'days' }
        }
    ];

    const results = generateExpiryQueue(applicationMeta, expiryEmailPeriods);
    const resultsClean = results.map(item => {
        return {
            ...item,
            ...{
                dateToSend: item.dateToSend.toISOString()
            }
        };
    });

    expect(resultsClean).toMatchSnapshot();
});
