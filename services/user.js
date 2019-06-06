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

function updateIsInPasswordReset({ id }) {
    return Users.update(
        { is_password_reset: true },
        {
            where: { id: { [Op.eq]: id } }
        }
    );
}

function updateActivateUser({ id }) {
    return Users.update(
        { is_active: true },
        {
            where: { id: { [Op.eq]: id } }
        }
    );
}

module.exports = {
    findWithActivePasswordReset,
    updateActivateUser,
    updateIsInPasswordReset
};
