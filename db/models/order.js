'use strict';

module.exports = (sequelize, DataTypes) => {
    let Order = sequelize.define('order', {
        grantAmount: {
            type: DataTypes.STRING,
            allowNull: true
        },
        orderReason: {
            type: DataTypes.STRING,
            allowNull: true
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
