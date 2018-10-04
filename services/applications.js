'use strict';
const request = require('request-promise-native');
const { APPLICATIONS_SERVICE_ENDPOINT } = require('../modules/secrets');

function store(formModel, applicationData) {
    return request.post(APPLICATIONS_SERVICE_ENDPOINT, {
        json: {
            formId: formModel.id,
            shortCode: formModel.shortCode,
            applicationData: applicationData
        }
    });
}

module.exports =  {
    store
};
