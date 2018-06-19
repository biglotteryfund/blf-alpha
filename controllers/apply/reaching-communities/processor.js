'use strict';
const { get, isArray } = require('lodash');

const appData = require('../../../modules/appData');
const mail = require('../../../modules/mail');
const { PROJECT_LOCATIONS, DEFAULT_EMAIL } = require('./constants');

module.exports = function processor(form, formData) {
    const flatData = form.getStepValuesFlattened(formData);
    const summary = form.getStepsWithValues(formData);

    /**
     * Construct a primary address (i.e. customer email)
     */
    const primaryAddress = `${flatData['first-name']} ${flatData['last-name']} <${flatData['email']}>`;
    let organisationName = `${flatData['organisation-name']}`;
    if (flatData['additional-organisations']) {
        organisationName += ` (plus ${flatData['additional-organisations']})`;
    }

    /**
     * Determine which internal address to send to:
     * - If in test then send to primaryAddress
     * - If multi-region, send to default/england-wide inbox
     * - Otherwise send to the matching inbox for the selected region
     */
    const internalAddress = (function() {
        if (appData.isNotProduction) {
            return primaryAddress;
        } else if (isArray(flatData.location)) {
            return DEFAULT_EMAIL;
        } else {
            const matchedLocation = PROJECT_LOCATIONS.find(l => l.value === flatData.location);
            return get(matchedLocation, 'email', DEFAULT_EMAIL);
        }
    })();

    return mail.generateAndSend([
        {
            name: 'reaching_communities_customer',
            sendTo: primaryAddress,
            sendFrom: 'Big Lottery Fund <noreply@blf.digital>',
            subject: 'Thank you for getting in touch with the Big Lottery Fund!',
            templateName: 'emails/applicationSummary',
            templateData: {
                summary: summary,
                form: form,
                data: flatData
            }
        },
        {
            name: 'reaching_communities_internal',
            sendTo: internalAddress,
            sendFrom: 'Big Lottery Fund <noreply@blf.digital>',
            subject: `New idea submission from website: ${organisationName}`,
            templateName: 'emails/applicationSummaryInternal',
            templateData: {
                summary: form.orderStepsForInternalUse(summary),
                form: form,
                data: flatData
            }
        }
    ]);
};
