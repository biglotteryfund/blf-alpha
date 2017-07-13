'use strict';
const bcrypt = require('bcryptjs');

module.exports = function (sequelize, DataTypes) {
    let User = sequelize.define('user', {
        username: {
            type: DataTypes.STRING
        },
        password: {
            type: DataTypes.STRING
        },
        level: {
            type: DataTypes.INTEGER
        }
    });

    User.prototype.isValidPassword = function (storedHash, typedPass) {
        const salt = bcrypt.genSaltSync(10);
        const hash = bcrypt.hashSync(typedPass, salt);
        return bcrypt.compareSync(typedPass, storedHash);
    };

    return User;

};