/* eslint-env jest */
'use strict';
const nodemailer = require('nodemailer');
const moment = require('moment');

const sendExpiryEmail = require('./send-expiry-email');

test('expiry email for awards for all', async function() {
    const mockTransport = nodemailer.createTransport({
        jsonTransport: true
    });

    const info = await sendExpiryEmail(
        {
            emailType: 'AFA_ONE_MONTH',
            unsubscribeToken: 'MOCK_TOKEN',
            formId: 'awards-for-all',
            applicationId: 'MOCK_APPLICATION_ID',
            applicationData: {
                projectCountry: 'england',
                projectName: 'Example project name'
            },
            expiresAt: moment('2050-06-01 12:00').toISOString(),
            username: 'example@example.com'
        },
        mockTransport
    );

    const infoMessage = JSON.parse(info.message);

    expect(infoMessage.subject).toBe(
        'You have one month to finish your application'
    );
    expect(infoMessage.text).toMatchSnapshot();
});

test('expiry email for standard funding proposal', async function() {
    const mockTransport = nodemailer.createTransport({
        jsonTransport: true
    });

    const info = await sendExpiryEmail(
        {
            emailType: 'STANDARD_ONE_MONTH',
            unsubscribeToken: 'MOCK_TOKEN',
            formId: 'standard-enquiry',
            applicationId: 'MOCK_APPLICATION_ID',
            applicationData: {
                projectCountry: 'england',
                projectName: 'Example project name'
            },
            expiresAt: moment('2050-06-01 12:00').toISOString(),
            username: 'example@example.com'
        },
        mockTransport
    );

    const infoMessage = JSON.parse(info.message);

    expect(infoMessage.subject).toBe(
        'You have one month to finish your funding proposal'
    );
    expect(infoMessage.text).toMatchSnapshot();
});
