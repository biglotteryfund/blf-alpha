'use strict';
const { Op } = require('sequelize');
const { Users } = require('../models');
const { purifyUserInput } = require('../modules/validators');

function findById(id) {
    return Users.findById(id);
}

function findByUsername(username) {
    return Users.findOne({
        where: { username: { [Op.eq]: purifyUserInput(username) } }
    });
}

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

function updateNewPassword({ newPassword, id }) {
    return Users.update(
        { password: newPassword, is_password_reset: false },
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

function createUser({ username, password }) {
    return Users.create({
        username: purifyUserInput(username),
        password: purifyUserInput(password)
    });
}

module.exports = {
    findById,
    findByUsername,
    findWithActivePasswordReset,
    updateIsInPasswordReset,
    updateNewPassword,
    updateActivateUser,
    createUser
};
