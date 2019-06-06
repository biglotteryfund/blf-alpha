'use strict';
const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const { Users } = require('../db/models');
const { sanitise } = require('../common/validators');

function encryptPassword(password) {
    const rounds = 12;
    return bcrypt.hash(password, rounds);
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

async function updateNewPassword({ newPassword, id }) {
    try {
        const newEncryptedPassword = await encryptPassword(
            sanitise(newPassword)
        );
        return Users.update(
            { password: newEncryptedPassword, is_password_reset: false },
            { where: { id: { [Op.eq]: id } } }
        );
    } catch (error) {
        throw error;
    }
}

async function updateNewEmail({ newEmail, id }) {
    try {
        return Users.update(
            { username: newEmail, is_active: false },
            { where: { id: { [Op.eq]: id } } }
        );
    } catch (error) {
        throw error;
    }
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
    updateIsInPasswordReset,
    updateNewPassword,
    updateNewEmail
};
