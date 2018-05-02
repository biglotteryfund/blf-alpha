'use strict';
const moment = require('moment');
const { Op } = require('sequelize');
const { Feedback } = require('../models');

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
    storeFeedback
};
