'use strict';
const moment = require('moment');
const { Op } = require('sequelize');

const { Application } = require('../models');

function makeTitle(formId) {
    return `${formId} - ${moment().toISOString()}`;
}

function createApplication({ userId, formId, title = null, data = null }) {
    if (!title) {
        title = makeTitle(formId);
    }
    return Application.create({
        user_id: userId,
        form_id: formId,
        application_title: title,
        application_data: data
    });
}

function getApplicationsForUser({ userId, formId }) {
    return Application.findAll({
        where: {
            user_id: {
                [Op.eq]: userId
            },
            form_id: {
                [Op.eq]: formId
            }
        },
        order: [['updatedAt', 'DESC']]
    });
}

function getApplicationById({ formId, applicationId, userId }) {
    return Application.findOne({
        where: {
            id: {
                [Op.eq]: applicationId
            },
            form_id: {
                [Op.eq]: formId
            },
            user_id: {
                [Op.eq]: userId
            }
        }
    });
}

function updateApplication(id, data) {
    return Application.update(
        {
            application_data: data
        },
        {
            where: {
                id: {
                    [Op.eq]: id
                }
            }
        }
    );
}

function deleteApplication(id, userId) {
    return Application.destroy({
        where: {
            user_id: {
                [Op.eq]: userId
            },
            id: {
                [Op.eq]: id
            }
        }
    });
}

function changeApplicationState(id, newState) {
    return Application.update(
        {
            status: newState
        },
        {
            where: {
                id: {
                    [Op.eq]: id
                }
            }
        }
    );
}

module.exports = {
    createApplication,
    getApplicationsForUser,
    getApplicationById,
    updateApplication,
    deleteApplication,
    changeApplicationState
};
