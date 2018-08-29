'use strict';
const { get, groupBy, sortBy, isArray } = require('lodash');

const mail = require('../../../modules/mail');
const appData = require('../../../modules/appData');

const { PROJECT_LOCATIONS, DEFAULT_EMAIL } = require('./constants');

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
    let organisationName = `${data['organisation-name']}`;
    if (data['additional-organisations']) {
        organisationName += ` (plus ${data['additional-organisations']})`;
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
        } else if (isArray(data.location)) {
            return DEFAULT_EMAIL;
        } else {
            const matchedLocation = PROJECT_LOCATIONS.find(l => l.value === data.location);
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
                data: data,
                summary: stepsWithValues
            }
        },
        {
            name: 'reaching_communities_internal',
            sendTo: internalAddress,
            sendFrom: 'Big Lottery Fund <noreply@blf.digital>',
            subject: `New idea submission from website: ${organisationName}`,
            templateName: 'emails/applicationSummaryInternal',
            templateData: {
                title: form.title,
                data: data,
                summary: orderStepsForInternalUse(stepsWithValues)
            }
        }
    ]);
};
