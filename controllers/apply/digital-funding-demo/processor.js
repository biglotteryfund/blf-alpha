'use strict';
const path = require('path');

const mail = require('../../../services/mail');
const appData = require('../../../modules/appData');
const { DIGITAL_FUND_DEMO_EMAIL } = require('../../../modules/secrets');

module.exports = function processor({ form, data, stepsWithValues }) {
    const customerSendTo = {
        name: `${data['first-name']} ${data['last-name']}`,
        address: data['email']
    };

    return mail.generateAndSend([
        {
            name: 'digital_funding_demo_customer',
            sendTo: customerSendTo,
            subject: 'Thank you for getting in touch with the Big Lottery Fund!',
            template: path.resolve(__dirname, './customer-email'),
            templateData: {
                data: data,
                summary: stepsWithValues
            }
        },
        {
            name: 'digital_funding_demo_internal',
            sendTo: appData.isDev ? customerSendTo : { address: DIGITAL_FUND_DEMO_EMAIL },
            subject: `New Digital Funding idea submission from website: ${data['organisation-name']}`,
            template: path.resolve(__dirname, './internal-email'),
            templateData: {
                title: form.title,
                data: data,
                summary: stepsWithValues
            }
        }
    ]);
};
