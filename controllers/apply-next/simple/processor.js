'use strict';
const { clone, has } = require('lodash');
const debug = require('debug')('tnlcf:a4a');
const features = require('config').get('features');

const { fromDateParts } = require('../../../modules/dates');
const salesforceService = require('../../../services/salesforce');

function salesforceApplication(application) {
    function dateFormat(dt) {
        return fromDateParts(dt).format('YYYY-MM-DD');
    }

    const enriched = clone(application);
    enriched.projectStartDate = dateFormat(enriched.projectStartDate);

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

/**
 * Process form submissions
 * @param {object} options
 * @param {object} options.form
 * @param {object} options.application
 * @param {object} options.meta
 */
async function processor({ application, meta }) {
    const submission = {
        meta: meta,
        application: salesforceApplication(application)
    };

    function shouldSend() {
        return (
            features.enableSalesforceConnector === true &&
            !!process.env.TEST_SERVER === false
        );
    }

    if (shouldSend()) {
        const salesforce = await salesforceService.authorise();
        return salesforce.submitFormData(submission);
    } else {
        debug(`skipped salesforce submission for ${meta.form}`);
        return Promise.resolve(submission);
    }
}

module.exports = {
    processor
};
