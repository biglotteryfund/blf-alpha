'use strict';
const has = require('lodash/fp/has');
const get = require('lodash/fp/get');
const Sentry = require('@sentry/node');

const logger = require('../../../common/logger').child({
    service: 'transform',
});

function transformProjectDateRange(applicationData) {
    if (has('projectDateRange')(applicationData)) {
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

function transform(applicationData) {
    // Add any default transforms here
    const transformsToRun = [transformProjectDateRange];

    if (transformsToRun.length === 0) {
        return applicationData;
    } else {
        return transformsToRun.reduce(
            (data, transformer) => transformer(data),
            applicationData
        );
    }
}

module.exports = {
    transform,
    // Export for tests
    transformProjectDateRange,
};
