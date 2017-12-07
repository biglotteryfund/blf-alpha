'use strict';

module.exports = (sequelize, DataTypes) => {
    let Order = sequelize.define('order', {
        grantAmount: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        postcodeArea: {
            type: DataTypes.STRING,
            allowNull: false
        }
    });

    Order.associate = models => {
        Order.hasMany(models.OrderItem, {
            as: 'items'
        });
    };

    return Order;
};
