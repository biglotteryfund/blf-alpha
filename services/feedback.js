'use strict';
const moment = require('moment');
const { Op } = require('sequelize');
const { groupBy } = require('lodash/fp');
const { Feedback } = require('../models');
const { purifyUserInput } = require('../modules/validators');

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

function storeFeedback({ description, message }) {
    cleanupOldData();
    return Feedback.create({
        description: purifyUserInput(description),
        message: purifyUserInput(message)
    });
}

function findAll() {
    return Feedback.findAll({
        order: [['description', 'ASC'], ['updatedAt', 'DESC']]
    }).then(results => {
        return groupBy(result => result.description.toLowerCase())(results);
    });
}

module.exports = {
    findAll,
    storeFeedback
};
