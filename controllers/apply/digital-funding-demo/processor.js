'use strict';
const path = require('path');

const mail = require('../../../modules/mail');
const appData = require('../../../modules/appData');
const { DIGITAL_FUND_DEMO_EMAIL } = require('../../../modules/secrets');

module.exports = function processor({ form, data, stepsWithValues }) {
    /**
     * Construct a primary address (i.e. customer email)
     */
    const primaryAddress = `${data['first-name']} ${data['last-name']} <${data['email']}>`;
    const organisationName = `${data['organisation-name']}`;

    return mail.generateAndSend([
        {
            name: 'digital_funding_demo_customer',
            sendTo: primaryAddress,
            sendFrom: 'Big Lottery Fund <noreply@blf.digital>',
            subject: 'Thank you for getting in touch with the Big Lottery Fund!',
            template: path.resolve(__dirname, './customer-email'),
            templateData: {
                data: data,
                summary: stepsWithValues
            }
        },
        {
            name: 'digital_funding_demo_internal',
            sendTo: appData.isDev ? primaryAddress : DIGITAL_FUND_DEMO_EMAIL,
            sendFrom: 'Big Lottery Fund <noreply@blf.digital>',
            subject: `New Digital Fund idea submission from website: ${organisationName}`,
            template: path.resolve(__dirname, './internal-email'),
            templateData: {
                title: form.title,
                data: data,
                summary: stepsWithValues
            }
        }
    ]);
};
