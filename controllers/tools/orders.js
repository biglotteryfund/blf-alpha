'use strict';
const path = require('path');
const express = require('express');
const moment = require('moment');
const countBy = require('lodash/countBy');
const filter = require('lodash/fp/filter');
const flatMap = require('lodash/flatMap');
const map = require('lodash/map');
const meanBy = require('lodash/meanBy');
const reverse = require('lodash/reverse');
const sortBy = require('lodash/sortBy');
const take = require('lodash/take');

const { injectMerchandise } = require('../../middleware/inject-content');
const { Order } = require('../../db/models');
const { getDateRange } = require('./helpers');

const router = express.Router();

function summariseOrders(orders) {
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

    const orderReasons = filterHasCode(
        orderByCount(countBy(orders, 'orderReason'))
    );
    const grantAmounts = filterHasCode(
        orderByCount(countBy(orders, 'grantAmount'))
    );
    let ordersByPostcodes = orderByCount(countBy(orders, 'postcodeArea'));

    let ordersByDay = orders.reduce((acc, order) => {
        let normalisedDate = moment(order.createdAt).format(
            normalisedDateFormat
        );
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
}

router.get(
    '/',
    injectMerchandise({ locale: 'en', showAll: true }),
    async (req, res, next) => {
        try {
            const dateRange = getDateRange(req.query.start, req.query.end);

            const [oldestOrder, orderData] = await Promise.all([
                Order.getOldestOrder(),
                Order.getAllOrders(dateRange).then(summariseOrders)
            ]);

            const materials = res.locals.availableItems;

            res.locals.getItemName = function(code) {
                // we have to search twice here because we only know the product code
                // so we have to find the material first (for its name) then check the product
                const material = materials.find(i =>
                    i.products.find(j => j.code === code)
                );

                if (material) {
                    const product = material.products.find(
                        p => p.code === code
                    );
                    return product.name ? product.name : material.title;
                } else {
                    return 'Unknown item';
                }
            };

            res.render(path.resolve(__dirname, './views/orders'), {
                data: orderData,
                oldestOrderDate: moment(oldestOrder.createdAt).toDate(),
                dateRange: dateRange,
                materials: materials
            });
        } catch (error) {
            next(error);
        }
    }
);

module.exports = router;
