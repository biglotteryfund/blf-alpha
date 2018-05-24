'use strict';
const moment = require('moment');
const { Op } = require('sequelize');
const { groupBy } = require('lodash/fp');
const { Feedback } = require('../models');

function findAll() {
    return Feedback.findAll({
        order: [['updatedAt', 'DESC']]
    }).then(results => {
        return groupBy(result => result.description.toLowerCase())(results);
    });
}

function storeFeedback(response) {
    cleanupOldData();
    return Feedback.create(response);
}

function cleanupOldData() {
    return Feedback.destroy({
        where: {
            createdAt: {
                [Op.lte]: moment()
                    .subtract(3, 'months')
                    .toDate()
            }
        }
    });
}

module.exports = {
    findAll,
    storeFeedback
};
