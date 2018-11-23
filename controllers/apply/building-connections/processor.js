'use strict';
const path = require('path');
const { generateHtmlEmail, sendEmail } = require('../../../services/mail');

module.exports = async function processor({ form, locale, data, stepsWithValues, copy }, mailTransport = null) {
    const customerSendTo = {
        name: `${data['name']}`,
        address: data['email']
    };

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

    return sendEmail({
        name: 'building_connections_tmp_customer',
        mailConfig: {
            sendTo: customerSendTo,
            subject: 'Thank you for getting in touch with the Big Lottery Fund!',
            type: 'html',
            content: customerHtml
        },
        mailTransport: mailTransport
    });
};
