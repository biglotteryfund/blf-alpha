'use strict';
const bcrypt = require('bcryptjs');

module.exports = (sequelize, DataTypes) => {
    let User = sequelize.define('user', {
        username: {
            type: DataTypes.STRING,
            allowNull: false
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false,
            set(val) {
                const salt = bcrypt.genSaltSync(10);
                const hash = bcrypt.hashSync(val, salt);
                this.setDataValue('password', hash);
            }
        },
        level: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        is_active: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        }
    });

    User.prototype.isValidPassword = (storedHash, typedPass) => {
        // const salt = bcrypt.genSaltSync(10);
        // const hash = bcrypt.hashSync(typedPass, salt);
        return bcrypt.compareSync(typedPass, storedHash);
    };

    return User;
};
