'use strict';
const path = require('path');
const clone = require('lodash/clone');
const debug = require('debug')('tnlcf:awards-for-all');

const salesforceService = require('../../../services/salesforce');
const { generateHtmlEmail, sendEmail } = require('../../../services/mail');
const { fromDateParts } = require('../../../modules/dates');

async function buildCustomerMailConfig(form, application) {
    const sendTo = {
        name: `${application.mainContactFirstName} ${
            application.mainContactLastName
        }`,
        address: application.mainContactEmail
    };

    const html = await generateHtmlEmail({
        template: path.resolve(__dirname, './customer-email.njk'),
        templateData: {
            form: form,
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

async function submitToSalesforce(submission) {
    /**
     * Skip sending mail in test environments
     */
    if (!!process.env.TEST_SERVER === true) {
        debug(`skipped salesforce submission for ${submission.meta.form}`);
        return Promise.resolve(submission);
    } else {
        const salesforce = await salesforceService.authorise();
        return salesforce.submitFormData(submission);
    }
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
    return Promise.all([
        submitToSalesforce({
            meta: meta,
            application: salesforceApplication(application)
        }),
        sendEmail({
            name: `${form.id}-customer-email`,
            mailConfig: await buildCustomerMailConfig(form, application),
            mailTransport: mailTransport
        })
    ]);
}

module.exports = {
    processor
};
