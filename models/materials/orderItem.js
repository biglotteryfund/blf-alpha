'use strict';

module.exports = (sequelize, DataTypes) => {
    return sequelize.define('order_item', {
        code: {
            type: DataTypes.STRING,
            allowNull: false
        },
        quantity: {
            type: DataTypes.INTEGER,
            allowNull: false
        }
    });
};
