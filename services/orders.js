const moment = require('moment');
const { Op } = require('sequelize');
const { Order, OrderItem } = require('../models');
const { take, countBy, meanBy, sortBy, flatMap, map, reverse } = require('lodash');
const { filter } = require('lodash/fp');

function getAllOrders() {
    return Order.findAll({
        order: [['updatedAt', 'DESC']],
        include: [
            {
                model: OrderItem,
                as: 'items'
            }
        ]
    }).then(orders => {
        const normalisedDateFormat = 'YYYY-MM-DD';
        // the date we added dropdown grant size options rather than free text
        const LAUNCH_DATE = '2018-02-01';

        const items = flatMap(orders, order => order.items);

        let totalOrders = orders.length;
        let averageProductsPerOrder = Math.round(meanBy(orders, 'items.length'));
        let averageItemQuantityPerOrder = Math.round(
            meanBy(orders, o => o.items.reduce((acc, cur) => acc + cur.quantity, 0))
        );

        let orderByCount = arr => {
            const mapped = map(arr, (count, code) => ({ code, count }));
            return reverse(sortBy(mapped, 'count'));
        };

        // sum items by their quantity ordered
        let itemsByQuantity = items.reduce((acc, cur) => {
            if (!acc[cur.code]) {
                acc[cur.code] = 0;
            }
            acc[cur.code] += cur.quantity;
            return acc;
        }, {});

        // @TODO this can be removed after July 1st when all order records will have the correct options
        const filterIsRecentOrder = filter(_ => moment(_.createdAt).isAfter(LAUNCH_DATE));
        const filterHasCode = filter(_ => _.code !== '' && _.code !== 'null');

        // order items by total ordered
        let mostPopularItemsByQuantity = orderByCount(itemsByQuantity);
        let mostPopularItems = take(orderByCount(countBy(items, 'code')), 10);

        const orderReasons = filterHasCode(orderByCount(countBy(orders, 'orderReason')));
        const ordersAfterLaunch = filterIsRecentOrder(orders);
        const grantAmounts = filterHasCode(orderByCount(countBy(ordersAfterLaunch, 'grantAmount')));
        let ordersByPostcodes = orderByCount(countBy(orders, 'postcodeArea'));

        let ordersByDay = orders.reduce((acc, order) => {
            let normalisedDate = moment(order.createdAt).format(normalisedDateFormat);
            if (!acc[normalisedDate]) {
                acc[normalisedDate] = 0;
            }
            acc[normalisedDate] = acc[normalisedDate] + 1;
            return acc;
        }, {});
        
        ordersByDay = sortBy(map(ordersByDay, (order, date) => ({
            x: date,
            y: order
        })), 'x');

        return {
            orders,
            totalOrders,
            averageProductsPerOrder,
            averageItemQuantityPerOrder,
            mostPopularItemsByQuantity,
            mostPopularItems,
            orderReasons,
            grantAmounts,
            ordersByPostcodes,
            ordersByDay
        };
    });
}

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
                [Op.lte]: moment()
                    .subtract(5, 'months')
                    .toDate()
            }
        }
    });
}

module.exports = {
    storeOrder,
    getAllOrders
};
