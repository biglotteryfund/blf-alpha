'use strict';
const { Op } = require('sequelize');
const { Users, Staff } = require('../models');
const { purifyUserInput } = require('../modules/validators');

function getSanitizedUser({ username, password, level }) {
    return {
        username: purifyUserInput(username),
        password: purifyUserInput(password),
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
                [Op.eq]: purifyUserInput(username)
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
                id: {
                    [Op.eq]: id
                }
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

// Staff-specific user functions
const createStaffUser = user => {
    return Staff.create({
        oid: user.oid,
        email: user.upn,
        given_name: user.name.givenName,
        family_name: user.name.familyName
    });
};

const findStaffUser = (oid, cb) => {
    return Staff.findOne({
        where: {
            oid: {
                [Op.eq]: oid
            }
        }
    })
        .then(user => {
            // update last login date
            user.changed('updatedAt', true);
            return user.save().then(() => {
                return cb(null, user);
            });
        })
        .catch(() => {
            return cb(null, null);
        });
};

const findStaffUserById = (id, cb) => {
    return Staff.findOne({
        where: {
            id: {
                [Op.eq]: id
            }
        }
    });
};

module.exports = {
    findById,
    findByUsername,
    findWithActivePasswordReset,
    updateIsInPasswordReset,
    updateNewPassword,
    updateActivateUser,
    createUser,
    createStaffUser,
    findStaffUser,
    findStaffUserById,
    __destroyAll
};
