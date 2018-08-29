'use strict';
const { groupBy, sortBy } = require('lodash');

const mail = require('../../../modules/mail');
const appData = require('../../../modules/appData');
const { DIGITAL_FUND_DEMO_EMAIL } = require('../../../modules/secrets');

function orderStepsForInternalUse(stepData) {
    // rank steps by their internal order (if provided), falling back to original (source) order
    const stepGroups = groupBy(stepData, s => (s.internalOrder ? 'ordered' : 'unordered'));
    return sortBy(stepGroups.ordered, 'internalOrder').concat(stepGroups.unordered);
}

module.exports = function processor({ form, data, stepsWithValues }) {
    /**
     * Construct a primary address (i.e. customer email)
     */
    const primaryAddress = `${data['first-name']} ${data['last-name']} <${data['email']}>`;
    const organisationName = `${data['organisation-name']}`;

    return mail.generateAndSend([
        {
            name: 'digital_funding_demo_customer',
            sendTo: primaryAddress,
            sendFrom: 'Big Lottery Fund <noreply@blf.digital>',
            subject: 'Thank you for getting in touch with the Big Lottery Fund!',
            templateName: 'emails/applicationSummary',
            templateData: {
                data: data,
                summary: stepsWithValues
            }
        },
        {
            name: 'digital_funding_demo_internal',
            sendTo: appData.isDev ? primaryAddress : DIGITAL_FUND_DEMO_EMAIL,
            sendFrom: 'Big Lottery Fund <noreply@blf.digital>',
            subject: `New Digital Fund idea submission from website: ${organisationName}`,
            templateName: 'emails/applicationSummaryInternal',
            templateData: {
                title: form.title,
                data: data,
                summary: orderStepsForInternalUse(stepsWithValues)
            }
        }
    ]);
};
