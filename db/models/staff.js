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

    /**
     * Find or create a new login profile.
     * Stores a snapshot of the active directory user,
     * and updates `updatedAt` to track last login date.
     */
    static findOrCreateProfile(profile) {
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
        }).then(([user]) => {
            user.changed('updatedAt', true);
            return user.save();
        });
    }

    get fullName() {
        return `${this.given_name} ${this.family_name}`;
    }
}

module.exports = Staff;
