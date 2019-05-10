'use strict';
const path = require('path');

const { generateHtmlEmail, sendEmail } = require('../../../services/mail');

/**
 * Process form submissions
 * @param {object} options
 * @param {object} options.form
 * @param {object} options.data
 * @param {any} mailTransport
 */
module.exports = async function processor(
    { form, data },
    mailTransport = null
) {
    const customerSendTo = {
        name: `${data['main-contact-first-name']} ${
            data['main-contact-last-name']
        }`,
        address: data['main-contact-email']
    };

    const customerHtml = await generateHtmlEmail({
        template: path.resolve(__dirname, './customer-email.njk'),
        templateData: {
            form: form,
            isArray: xs => Array.isArray(xs),
            showDataProtectionStatement: true
        }
    });

    return Promise.all([
        sendEmail({
            name: 'simple_prototype_customer',
            mailConfig: {
                sendTo: customerSendTo,
                subject:
                    'Thank you for getting in touch with The National Lottery Community Fund!',
                type: 'html',
                content: customerHtml
            },
            mailTransport: mailTransport
        })
    ]);
};
