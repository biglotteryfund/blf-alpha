'use strict';
const config = require('config');
const has = require('lodash/fp/has');
const get = require('lodash/fp/get');
const flow = require('lodash/flow');
const Sentry = require('@sentry/node');

const logger = require('../../../common/logger').child({
    service: 'transform'
});

function transformProjectDateRange(applicationData) {
    if (
        config.get('awardsForAll.enableNewDateRange') === true &&
        has('projectDateRange')(applicationData)
    ) {
        logger.info('Transforming projectDateRange');

        try {
            const oldDateRange = get('projectDateRange')(applicationData);
            applicationData.projectStartDate = oldDateRange.startDate;
            applicationData.projectEndDate = oldDateRange.endDate;
            delete applicationData['projectDateRange'];
        } catch (err) {
            logger.error('Failed to transform projectDateRange');
            Sentry.captureException(err);
        }
    }

    return applicationData;
}

module.exports = function transform(applicationData) {
    // Add additional transforms here
    return flow(transformProjectDateRange)(applicationData);
};
