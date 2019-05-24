'use strict';
const path = require('path');
const { clone, has } = require('lodash');
const debug = require('debug')('tnlcf:awards-for-all');
const features = require('config').get('features');

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
    enriched.projectDateRange = {
        start: dateFormat(enriched.projectDateRange.start),
        end: dateFormat(enriched.projectDateRange.end)
    };

    if (has(enriched, 'mainContactDateOfBirth')) {
        enriched.mainContactDateOfBirth = dateFormat(
            enriched.mainContactDateOfBirth
        );
    }

    if (has(enriched, 'seniorContactDateOfBirth')) {
        enriched.seniorContactDateOfBirth = dateFormat(
            enriched.seniorContactDateOfBirth
        );
    }

    return enriched;
}

async function submitToSalesforce(submission) {
    /**
     * Skip sending mail in test environments
     */
    if (
        features.enableSalesforceConnector === true &&
        !!process.env.TEST_SERVER === false
    ) {
        const salesforce = await salesforceService.authorise();
        return salesforce.submitFormData(submission);
    } else {
        debug(`skipped salesforce submission for ${submission.meta.form}`);
        return Promise.resolve(submission);
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
