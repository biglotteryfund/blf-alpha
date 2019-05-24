'use strict';
const { Op } = require('sequelize');
const { Staff } = require('../db/models');

function findById(id) {
    return Staff.findById(id);
}

const findOrCreate = (userProfile, cb) => {
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
    })
        .spread((user, wasCreated) => {
            // update last login date
            user.changed('updatedAt', true);
            return user.save().then(() => {
                return cb(null, { user, wasCreated });
            });
        })
        .catch(() => {
            return cb(null, null);
        });
};

module.exports = {
    findById,
    findOrCreate
};
