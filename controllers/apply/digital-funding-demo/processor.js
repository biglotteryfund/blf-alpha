'use strict';
const path = require('path');

const appData = require('../../../modules/appData');
const { generateHtmlEmail, sendEmail } = require('../../../services/mail');
const { DIGITAL_FUND_DEMO_EMAIL } = require('../../../modules/secrets');

module.exports = async function processor({ form, data, stepsWithValues, mailTransport }) {
    const customerSendTo = {
        name: `${data['first-name']} ${data['last-name']}`,
        address: data['email']
    };

    const customerHtml = await generateHtmlEmail({
        template: path.resolve(__dirname, './customer-email.njk'),
        templateData: {
            data: data,
            summary: stepsWithValues,
            isArray: xs => Array.isArray(xs)
        }
    });

    const internalHtml = await generateHtmlEmail({
        template: path.resolve(__dirname, './internal-email.njk'),
        templateData: {
            title: form.title,
            data: data,
            summary: stepsWithValues,
            isArray: xs => Array.isArray(xs)
        }
    });

    return Promise.all([
        sendEmail(mailTransport, 'digital_funding_demo_customer', {
            sendTo: customerSendTo,
            subject: 'Thank you for getting in touch with the Big Lottery Fund!',
            type: 'html',
            content: customerHtml
        }),
        sendEmail(mailTransport, 'digital_funding_demo_internal', {
            sendTo: appData.isDev ? customerSendTo : { address: DIGITAL_FUND_DEMO_EMAIL },
            subject: `New Digital Funding idea submission from website: ${data['organisation-name']}`,
            type: 'html',
            content: internalHtml
        })
    ]);
};
