'use strict';
const path = require('path');

const appData = require('../../../modules/appData');
const { generateHtmlEmail, sendEmail } = require('../../../services/mail');
const { DIGITAL_FUND_EMAIL } = require('../../../modules/secrets');

/**
 * Process form submissions
 * @param {object} options
 * @param {object} options.form
 * @param {string} options.locale
 * @param {object} options.data
 * @param {object} options.stepsWithValues
 * @param {object} options.copy
 * @param {any} mailTransport
 */
module.exports = async function processor({ form, locale, data, stepsWithValues, copy }, mailTransport = null) {
    const customerSendTo = {
        name: `${data['name']}`,
        address: data['email']
    };

    const emailTemplateData = {
        data: data,
        description: form.description,
        stepsCopy: copy.steps,
        fieldsCopy: copy.fields,
        summary: stepsWithValues,
        locale: locale,
        isArray: xs => Array.isArray(xs)
    };

    const customerHtml = await generateHtmlEmail({
        template: path.resolve(__dirname, './customer-email.njk'),
        templateData: emailTemplateData
    });

    const internalHtml = await generateHtmlEmail({
        template: path.resolve(__dirname, './internal-email.njk'),
        templateData: emailTemplateData
    });

    return Promise.all([
        sendEmail({
            name: locale === 'en' ? 'digital_fund_customer' : 'digital_fund_customer_welsh',
            mailConfig: {
                sendTo: customerSendTo,
                subject: 'Thank you for getting in touch with the Big Lottery Fund!',
                type: 'html',
                content: customerHtml
            },
            mailTransport: mailTransport
        }),
        sendEmail({
            name: locale === 'en' ? 'digital_fund_internal' : 'digital_fund_internal_welsh',
            mailConfig: {
                sendTo: appData.isNotProduction ? customerSendTo : DIGITAL_FUND_EMAIL,
                subject: `New submission for ${form.description} from ${data['organisation-name']}`,
                type: 'html',
                content: internalHtml
            },
            mailTransport: mailTransport
        })
    ]);
};
