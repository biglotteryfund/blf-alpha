'use strict';
const hash = require('object-hash');
const { Op } = require('sequelize');

const { Application } = require('../models');
const { purifyUserInput } = require('../modules/validators');

function getReferenceId(prefix, applicationData) {
    return `${prefix}-${hash
        .sha1(applicationData)
        .slice(0, 6)
        .toUpperCase()}`;
}

function storeApplication(formId, prefix, applicationData) {
    return Application.create({
        form_id: formId,
        reference_id: getReferenceId(prefix, applicationData),
        application_data: applicationData
    });
}

function getApplicationsByForm(formId) {
    return Application.findAll({
        order: [['updatedAt', 'DESC']],
        where: {
            form_id: {
                [Op.eq]: formId
            }
        }
    });
}

function getApplicationsById(applicationId) {
    return Application.findOne({
        where: {
            reference_id: {
                [Op.eq]: purifyUserInput(applicationId)
            }
        }
    });
}

module.exports = {
    getReferenceId,
    storeApplication,
    getApplicationsByForm,
    getApplicationsById
};
