'use strict';
const hash = require('object-hash');
const { Application } = require('../models');

function getReferenceId(prefix, applicationData) {
    return `${prefix}-${hash
        .sha1(applicationData)
        .slice(0, 6)
        .toUpperCase()}`;
}

function storeApplication(prefix, applicationData) {
    return Application.create({
        reference_id: getReferenceId(prefix, applicationData),
        application_data: applicationData
    });
}

module.exports = {
    getReferenceId,
    storeApplication
};
