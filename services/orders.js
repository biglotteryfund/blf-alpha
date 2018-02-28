const moment = require('moment');
const { Op } = require('sequelize');
const { Order, OrderItem } = require('../models');
const { take, countBy, meanBy, chain, sortBy } = require('lodash');

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

        let items = orders.reduce((acc, cur) => acc.concat(cur.items), []);

        let totalOrders = orders.length;
        let averageProductsPerOrder = Math.round(meanBy(orders, 'items.length'));
        let averageItemQuantityPerOrder = Math.round(meanBy(orders, o => o.items.reduce((acc, cur) => acc + cur.quantity, 0)));

        let orderByCount = arr => {
            return chain(arr).map((count, code) => {
                return {
                    code: code,
                    count: count
                };
            }).sortBy('count').reverse().value();
        };

        // sum items by their quantity ordered
        let itemsByQuantity = items.reduce((acc, cur) => {
            if (!acc[cur.code]) {
                acc[cur.code] = 0;
            }
            acc[cur.code] += cur.quantity;
            return acc;
        }, {});

        // order items by total ordered
        let mostPopularItemsByQuantity = orderByCount(itemsByQuantity);
        let mostPopularItems = take(orderByCount(countBy(items, 'code')), 10);

        let orderReasons = orderByCount(countBy(orders, 'orderReason')).filter(o => {
            return o.code !== '';
        });

        let ordersAfterLaunch = orders.filter(o => moment(o.createdAt).isAfter(LAUNCH_DATE));
        let grantAmounts = orderByCount(countBy(ordersAfterLaunch, 'grantAmount')).filter(o => {
            return o.code !== '';
        });

        let ordersByPostcodes = orderByCount(countBy(orders, 'postcodeArea'));

        let ordersByDay = orders.reduce((acc, order) => {
            let normalisedDate = moment(order.createdAt).format(normalisedDateFormat);
            if (!acc[normalisedDate]) {
                acc[normalisedDate] = 0;
            }
            acc[normalisedDate] = acc[normalisedDate] + 1;
            return acc;
        }, {});

        let voteData = [];
        for (let date in ordersByDay) {
            voteData.push({
                x: date,
                y: ordersByDay[date]
            });
        }

        ordersByDay = sortBy(voteData, 'x');

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

function storeOrder({grantAmount, orderReason, postcodeArea, items}) {
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
