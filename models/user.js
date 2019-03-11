'use strict';
const bcrypt = require('bcryptjs');

module.exports = (sequelize, DataTypes) => {
    const User = sequelize.define('user', {
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
    });

    User.hook('beforeCreate', function(user) {
        const rounds = 12;
        return bcrypt
            .hash(user.password, rounds)
            .then(hashedPassword => {
                user.password = hashedPassword;
            })
            .catch(err => {
                throw new Error(err);
            });
    });

    User.prototype.isValidPassword = (storedHash, typedPass) => {
        return bcrypt.compare(typedPass, storedHash);
    };

    return User;
};
