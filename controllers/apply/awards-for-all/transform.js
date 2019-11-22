'use strict';
const has = require('lodash/fp/has');
const get = require('lodash/fp/get');

module.exports = function transform(applicationData) {
    if (has('projectDateRange')(applicationData)) {
        const oldDateRange = get('projectDateRange')(applicationData);

        applicationData.projectStartDate = oldDateRange.startDate;
        applicationData.projectEndDate = oldDateRange.endDate;
        delete applicationData['projectDateRange'];
    }

    return applicationData;
};
