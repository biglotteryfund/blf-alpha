'use strict';
const moment = require('moment');
const { Op } = require('sequelize');

const { Application } = require('../models');

function makeTitle(formId) {
    return `${formId} - ${moment().toISOString()}`;
}

function createApplication({ userId, formId, title = false }) {
    if (!title) {
        title = makeTitle(formId);
    }
    return Application.create({
        user_id: userId,
        form_id: formId,
        application_title: title,
        application_data: ''
    });
}

function getApplicationsForUser(userId, formId) {
    return Application.findAll({
        where: {
            user_id: {
                [Op.eq]: userId
            },
            form_id: {
                [Op.eq]: formId
            }
        }
    });
}

// function findOrCreateApplication(applicationData, cb) {
//     return Application.findOrCreate({
//         where: {
//             id: {
//                 [Op.eq]: applicationData.id
//             }
//         },
//         defaults: {
//             user_id: applicationData.userId,
//             form_id: applicationData.formId,
//             application_title: applicationData.title || makeTitle(applicationData.formId),
//             application_data: ''
//         }
//     })
//         .spread((application, wasCreated) => {
//             return cb(null, { application, wasCreated });
//         })
//         .catch(err => {
//             return cb(err, null);
//         });
// }

module.exports = {
    createApplication,
    getApplicationsForUser
    // findOrCreateApplication
};
