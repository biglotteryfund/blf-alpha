'use strict';
const path = require('path');
const express = require('express');
const router = express.Router();

const { injectMerchandise } = require('../../middleware/inject-content');
const orderService = require('../../services/orders');

router.get('/', injectMerchandise({ locale: 'en', showAll: true }), async (req, res, next) => {
    try {
        const orderData = await orderService.getAllOrders();
        const materials = res.locals.availableItems;

        res.locals.getItemName = code => {
            // we have to search twice here because we only know the product code
            // so we have to find the material first (for its name) then check the product
            const material = materials.find(i => i.products.find(j => j.code === code));
            if (!material) {
                return 'Unknown item';
            }
            const product = material.products.find(p => p.code === code);
            return product.name ? product.name : material.title;
        };

        res.render(path.resolve(__dirname, './views/orders'), {
            data: orderData,
            materials: materials
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
