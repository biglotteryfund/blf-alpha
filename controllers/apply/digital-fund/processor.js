'use strict';
const path = require('path');

const appData = require('../../../modules/appData');
const { generateHtmlEmail, sendEmail } = require('../../../services/mail');
const { DIGITAL_FUND_EMAIL } = require('../../../modules/secrets');

module.exports = async function processor({ data, stepsWithValues, copy, mailTransport = null }) {
    const customerSendTo = {
        name: `${data['name']}`,
        address: data['email']
    };

    const customerHtml = await generateHtmlEmail({
        template: path.resolve(__dirname, './customer-email.njk'),
        templateData: {
            data: data,
            stepsCopy: copy.steps,
            fieldsCopy: copy.fields,
            summary: stepsWithValues,
            isArray: xs => Array.isArray(xs)
        }
    });

    const internalHtml = await generateHtmlEmail({
        template: path.resolve(__dirname, './internal-email.njk'),
        templateData: {
            data: data,
            title: copy.title,
            stepsCopy: copy.steps,
            fieldsCopy: copy.fields,
            summary: stepsWithValues,
            isArray: xs => Array.isArray(xs)
        }
    });

    return Promise.all([
        sendEmail({
            name: 'digital_fund_customer',
            mailConfig: {
                sendTo: customerSendTo,
                subject: 'Thank you for getting in touch with the Big Lottery Fund!',
                type: 'html',
                content: customerHtml
            },
            mailTransport: mailTransport
        }),
        sendEmail({
            name: 'digital_fund_internal',
            mailConfig: {
                sendTo: appData.isNotProduction ? customerSendTo : DIGITAL_FUND_EMAIL,
                subject: `New Digital Fund submission: ${data['organisation-name']}`,
                type: 'html',
                content: internalHtml
            },
            mailTransport: mailTransport
        })
    ]);
};
