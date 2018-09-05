'use strict';
const path = require('path');

const appData = require('../../../modules/appData');
const { generateHtmlEmail, sendEmail } = require('../../../services/mail');
const { DIGITAL_FUND_DEMO_EMAIL } = require('../../../modules/secrets');

module.exports = async function processor({ form, data, stepsWithValues, mailTransport = null }) {
    const customerSendTo = {
        name: `${data['name']}`,
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
        sendEmail({
            name: 'digital_funding_demo_customer',
            mailConfig: {
                sendTo: customerSendTo,
                subject: 'Thank you for getting in touch with the Big Lottery Fund!',
                type: 'html',
                content: customerHtml
            },
            mailTransport: mailTransport
        }),
        sendEmail({
            name: 'digital_funding_demo_internal',
            mailConfig: {
                sendTo: appData.isDev ? customerSendTo : { address: DIGITAL_FUND_DEMO_EMAIL },
                subject: `New Digital Funding idea submission from website: ${data['organisation-name']}`,
                type: 'html',
                content: internalHtml
            },
            mailTransport: mailTransport
        })
    ]);
};
