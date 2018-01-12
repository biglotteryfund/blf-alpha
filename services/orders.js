const { Order, OrderItem } = require('../models');

function storeOrder({ grantAmount, postcodeArea, items }) {
    return Order.create(
        {
            grantAmount: grantAmount,
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

module.exports = {
    storeOrder
};
