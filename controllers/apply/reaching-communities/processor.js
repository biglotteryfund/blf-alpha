'use strict';
const path = require('path');

const { generateHtmlEmail, sendEmail } = require('../../../services/mail');
const appData = require('../../../modules/appData');

const { determineInternalSendTo, orderStepsForInternalUse } = require('./helpers');

module.exports = async function processor({ form, data, stepsWithValues, mailTransport = null }) {
    const customerSendTo = {
        name: `${data['first-name']} ${data['last-name']}`,
        address: data['email']
    };

    let organisationName = `${data['organisation-name']}`;
    if (data['additional-organisations']) {
        organisationName += ` (plus ${data['additional-organisations']})`;
    }

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
            summary: orderStepsForInternalUse(stepsWithValues),
            isArray: xs => Array.isArray(xs)
        }
    });

    return Promise.all([
        sendEmail({
            name: 'reaching_communities_customer',
            mailConfig: {
                sendTo: [customerSendTo],
                subject: 'Thank you for getting in touch with the Big Lottery Fund!',
                type: 'html',
                content: customerHtml
            },
            mailTransport: mailTransport
        }),
        sendEmail({
            name: 'reaching_communities_internal',
            mailConfig: {
                sendTo: appData.isNotProduction ? [customerSendTo] : determineInternalSendTo(data.location),
                subject: `New idea submission from website: ${organisationName}`,
                type: 'html',
                content: internalHtml
            },
            mailTransport: mailTransport
        })
    ]);
};
