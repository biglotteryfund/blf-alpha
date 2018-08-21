'use strict';
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

        const filterHasCode = filter(_ => _.code !== '' && _.code !== 'null');

        // order items by total ordered
        let mostPopularItemsByQuantity = orderByCount(itemsByQuantity);
        let mostPopularItems = take(orderByCount(countBy(items, 'code')), 10);

        const orderReasons = filterHasCode(orderByCount(countBy(orders, 'orderReason')));
        const grantAmounts = filterHasCode(orderByCount(countBy(orders, 'grantAmount')));
        let ordersByPostcodes = orderByCount(countBy(orders, 'postcodeArea'));

        let ordersByDay = orders.reduce((acc, order) => {
            let normalisedDate = moment(order.createdAt).format(normalisedDateFormat);
            if (!acc[normalisedDate]) {
                acc[normalisedDate] = 0;
            }
            acc[normalisedDate] = acc[normalisedDate] + 1;
            return acc;
        }, {});

        ordersByDay = sortBy(
            map(ordersByDay, (order, date) => ({
                x: date,
                y: order
            })),
            'x'
        );

        const averageOrdersPerDay = Math.round(meanBy(ordersByDay, 'y'));

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
            ordersByDay,
            averageOrdersPerDay
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
