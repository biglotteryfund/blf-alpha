const moment = require('moment');
const { Op } = require('sequelize');
const { Order, OrderItem } = require('../models');

function storeOrder({ grantAmount, orderReason, postcodeArea, items }) {
    cleanupOldOrders();
    return Order.create(
        {
            grantAmount: grantAmount,
            orderReason: orderReason,
            postcodeArea: postcodeArea,
            items: items
        },
        {
            include: [
                {
                    model: OrderItem,
                    as: 'items'
                }
            ]
        }
    );
}

// GDPR compliance
function cleanupOldOrders() {
    return Order.destroy({
        where: {
            createdAt: {
                [Op.lte]: moment().subtract(6, 'months').toDate()
            }
        }
    });
}

module.exports = {
    storeOrder
};
