const xss = require('xss');
const { Op } = require('sequelize');
const { Users } = require('../models');

function getSanitizedUser({ username, password, level }) {
    return {
        username: xss(username),
        password: xss(password),
        level: level || 0
    };
}

function findById(id) {
    return Users.findById(id);
}

function findByUsername(username) {
    return Users.findOne({
        where: {
            username: {
                [Op.eq]: xss(username)
            }
        }
    });
}

function findWithActivePasswordReset({ id }) {
    return Users.findOne({
        where: {
            id: {
                [Op.eq]: id
            },
            is_password_reset: true
        }
    });
}

function updateIsInPasswordReset({ id }) {
    return Users.update(
        {
            is_password_reset: true
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

function updateNewPassword({ newPassword, id }) {
    return Users.update(
        {
            password: newPassword,
            is_password_reset: false
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

function updateActivateUser({ id }) {
    return Users.update(
        {
            is_active: true
        },
        {
            where: {
                [Op.eq]: id
            }
        }
    );
}

function createUser({ username, password, level }) {
    return Users.create(
        getSanitizedUser({
            username,
            password,
            level
        })
    );
}

function __destroyAll() {
    return Users.destroy({ where: {} });
}

module.exports = {
    findById,
    findByUsername,
    findWithActivePasswordReset,
    updateIsInPasswordReset,
    updateNewPassword,
    updateActivateUser,
    createUser,
    __destroyAll
};
