'use strict';
const { Op } = require('sequelize');
const { Users } = require('../db/models');

function findWithActivePasswordReset({ id }) {
    return Users.findOne({
        where: {
            id: { [Op.eq]: id },
            is_password_reset: true
        }
    });
}

module.exports = {
    findWithActivePasswordReset
};
