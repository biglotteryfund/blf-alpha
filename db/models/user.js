'use strict';
const { Model } = require('sequelize');

const bcrypt = require('bcryptjs');

class User extends Model {
    static init(sequelize, DataTypes) {
        const schema = {
            username: {
                type: DataTypes.STRING,
                allowNull: false
            },
            password: {
                type: DataTypes.STRING,
                allowNull: false
            },
            is_active: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false
            },
            is_password_reset: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false
            }
        };

        return super.init(schema, {
            modelName: 'user',
            sequelize
        });
    }

    static hasValidPassword(storedHash, typedPass) {
        return bcrypt.compare(typedPass, storedHash);
    }
}

module.exports = User;
