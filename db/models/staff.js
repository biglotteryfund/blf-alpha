'use strict';
const { Model, Op } = require('sequelize');

class Staff extends Model {
    static init(sequelize, DataTypes) {
        const schema = {
            oid: {
                type: DataTypes.STRING,
                allowNull: false
            },
            email: {
                type: DataTypes.STRING,
                allowNull: false
            },
            given_name: {
                type: DataTypes.STRING,
                allowNull: true
            },
            family_name: {
                type: DataTypes.STRING,
                allowNull: true
            }
        };

        return super.init(schema, {
            modelName: 'staff',
            freezeTableName: true,
            sequelize
        });
    }

    static findOrCreateProfile(profile, done) {
        // @TODO: Can this be returned as a Promise, rather than using `done`
        return this.findOrCreate({
            where: {
                oid: { [Op.eq]: profile.oid }
            },
            defaults: {
                oid: profile.oid,
                email: profile.upn,
                given_name: profile.name.givenName,
                family_name: profile.name.familyName
            }
        })
            .spread((user, wasCreated) => {
                // update last login date
                user.changed('updatedAt', true);
                return user.save().then(() => {
                    return done(null, { user, wasCreated });
                });
            })
            .catch(() => {
                return done(null, null);
            });
    }

    get fullName() {
        return `${this.given_name} ${this.family_name}`;
    }
}

module.exports = Staff;
