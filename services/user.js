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
const findOrCreateStaffUser = (userProfile, cb) => {
    return Staff.findOrCreate({
        where: {
            oid: {
                [Op.eq]: userProfile.oid
            }
        },
        defaults: {
            oid: userProfile.oid,
            email: userProfile.upn,
            given_name: userProfile.name.givenName,
            family_name: userProfile.name.familyName
        }
    }).spread((user, wasCreated) => {
        // update last login date
        user.changed('updatedAt', true);
        return user.save().then(() => {
            return cb(null, { user, wasCreated });
        });
    }).catch(() => {
        return cb(null, null);
    });
};

const findStaffUserById = id => {
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
    findOrCreateStaffUser,
    findStaffUserById,
    __destroyAll
};
