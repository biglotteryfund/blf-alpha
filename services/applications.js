'use strict';
const Hashids = require('hashids');
const { Application } = require('../models');

function getReferenceId(prefix, id) {
    var hashids = new Hashids('', 6);
    return `${prefix}-${hashids.encode(id).toUpperCase()}`;
}

function storeApplication(applicationData) {
    return Application.create({
        application_data: applicationData
    });
}

module.exports = {
    getReferenceId,
    storeApplication
};
