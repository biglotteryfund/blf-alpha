'use strict';

const shortid = require('shortid');
const { Application } = require('../models');

function storeApplication({ shortCode, applicationData }) {
    return Application.create({
        reference_id: `${shortCode}-${shortid()}`,
        application_data: applicationData
    });
}

module.exports = {
    storeApplication
};
