'use strict';
const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const { Users } = require('../models');
const { purifyUserInput } = require('../modules/validators');

function encryptPassword(password) {
    const rounds = 12;
    return bcrypt.hash(password, rounds);
}

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

async function createUser({ username, password }) {
    try {
        const encryptedPassword = await encryptPassword(purifyUserInput(password));
        return Users.create({
            username: purifyUserInput(username),
            password: encryptedPassword
        });
    } catch (error) {
        throw error;
    }
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
        const newEncryptedPassword = await encryptPassword(purifyUserInput(newPassword));
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
        return Users.update({ username: newEmail, is_active: false }, { where: { id: { [Op.eq]: id } } });
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

function isValidPassword(storedHash, typedPass) {
    return bcrypt.compare(typedPass, storedHash);
}

module.exports = {
    createUser,
    findById,
    findByUsername,
    findWithActivePasswordReset,
    isValidPassword,
    updateActivateUser,
    updateIsInPasswordReset,
    updateNewPassword,
    updateNewEmail
};
