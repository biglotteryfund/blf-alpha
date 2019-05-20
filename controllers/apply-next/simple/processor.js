'use strict';
const path = require('path');
const clone = require('lodash/clone');

const salesforceService = require('../../../services/salesforce');
const { generateHtmlEmail, sendEmail } = require('../../../services/mail');
const { fromDateParts } = require('../../../modules/dates');

function salesforceApplication(application) {
    function dateFormat(dt) {
        return fromDateParts(dt).format('YYYY-MM-DD');
    }

    const enriched = clone(application);
    enriched.projectStartDate = dateFormat(enriched.projectStartDate);
    enriched.mainContactDateOfBirth = dateFormat(
        enriched.mainContactDateOfBirth
    );
    enriched.seniorContactDateOfBirth = dateFormat(
        enriched.seniorContactDateOfBirth
    );

    return enriched;
}

async function buildCustomerMailConfig(form, application) {
    const sendTo = {
        name: `${application['mainContactFirstName']} ${
            application['mainContactLastName']
        }`,
        address: application['mainContactEmail']
    };

    const html = await generateHtmlEmail({
        template: path.resolve(__dirname, './customer-email.njk'),
        templateData: {
            form: form,
            isArray: xs => Array.isArray(xs),
            showDataProtectionStatement: true
        }
    });

    return {
        sendTo: sendTo,
        subject: `Thank you for getting in touch with The National Lottery Community Fund!`,
        type: 'html',
        content: html
    };
}

/**
 * Process form submissions
 * @param {object} options
 * @param {object} options.form
 * @param {object} options.application
 * @param {object} options.meta
 * @param {any} mailTransport
 */
async function processor({ form, application, meta }, mailTransport = null) {
    const salesforce = await salesforceService.authorise();
    const customerMailConfig = await buildCustomerMailConfig(form, application);

    return Promise.all([
        salesforce.submitFormData({
            meta: meta,
            application: salesforceApplication(application)
        }),
        sendEmail({
            name: 'simple_prototype_customer',
            mailConfig: customerMailConfig,
            mailTransport: mailTransport
        })
    ]);
}

module.exports = {
    processor
};
