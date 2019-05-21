'use strict';
const path = require('path');
const clone = require('lodash/clone');

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

/**
 * Process form submissions
 * @param {object} options
 * @param {object} options.form
 * @param {object} options.application
 * @param {object} options.meta
 * @param {any} mailTransport
 */
async function processor({ form, application, meta }, mailTransport = null) {
    const forSalesforce = {
        meta: meta,
        application: salesforceApplication(application)
    };

    const customerSendTo = {
        name: `${application['mainContactFirstName']} ${
            application['mainContactLastName']
        }`,
        address: application['mainContactEmail']
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
        forSalesforce,
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
}

module.exports = {
    processor
};
