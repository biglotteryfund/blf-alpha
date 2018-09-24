'use strict';
const path = require('path');

const { generateHtmlEmail, sendEmail } = require('../../../services/mail');

module.exports = async function processor({ data, stepsWithValues, copy, mailTransport = null }) {
    const customerSendTo = { name: data['contact-name'], address: data['contact-email'] };

    const customerHtml = await generateHtmlEmail({
        template: path.resolve(__dirname, './customer-email.njk'),
        templateData: {
            data: data,
            copy: copy,
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
            name: 'youth_capacity_customer',
            mailConfig: {
                sendTo: customerSendTo,
                subject: 'Thank you for getting in touch with the Big Lottery Fund!',
                type: 'html',
                content: customerHtml
            },
            mailTransport: mailTransport
        }),
        sendEmail({
            name: 'youth_capacity_internal',
            mailConfig: {
                sendTo: customerSendTo, // @TODO: Determine correct internal send address
                subject: `${copy.title}: New expression of interest from ${data['organisation-name']}`,
                type: 'html',
                content: internalHtml
            },
            mailTransport: mailTransport
        })
    ]);
};
