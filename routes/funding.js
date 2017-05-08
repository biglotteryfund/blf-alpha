'use strict';
const express = require('express');
const router = express.Router();
const materials = require('../config/content/materials.json');

const PATHS = {
    manageFunding:     '/funding-guidance/managing-your-funding',
    helpWithPublicity: '/funding-guidance/managing-your-funding/help-with-publicity',
    freeMaterials:     '/funding-guidance/managing-your-funding/ordering-free-materials',
    logoIndex:         '/funding-guidance/managing-your-funding/grant-acknowledgement-and-logos',
    logoDownloads:     '/funding-guidance/managing-your-funding/grant-acknowledgement-and-logos/logodownloads'
};

// redirect logoIndex => logoDownloads
router.get(PATHS.logoIndex, (req, res, next) => {
    res.redirect(req.baseUrl + PATHS.logoDownloads);
});

// logo download page
router.get(PATHS.logoDownloads, (req, res, next) => {
    res.render('pages/funding/guidance/logos', {
        title: "Logos"
    });
});

// funding management page
router.get(PATHS.manageFunding, (req, res, next) => {
    res.render('pages/funding/guidance/managing-your-funding', {
        title: "Managing your funding"
    });
});

// ordering free materials page
router.route(PATHS.freeMaterials)
    .get((req, res, next) => {
        res.render('pages/funding/guidance/order-free-materials', {
            title: req.i18n.__("funding.guidance.order-free-materials.title"),
            materials: materials.categories,
            quantities: (req.session.quantities) ? req.session.quantities : {}
        });
    })
    .post((req, res, next) => {
        let itemID = parseInt(req.body.itemID);
        let categoryID = parseInt(req.body.categoryID);
        let notAllowedWithItem = req.body.notAllowedWithItem;

        // create storage
        if (!req.session.quantities) { req.session.quantities = {}; }
        if (!req.session.quantities[itemID]) { req.session.quantities[itemID] = 0; }

        // find the item data
        let cat = materials.categories.find(c => c.id === categoryID);
        let item = cat.items.find(i => i.id === itemID);
        let maxQuantity = item.maximum;

        // increment or decrement count
        if (req.body.quantity === 'increase') {
            const blockedFromAdding = (notAllowedWithItem && req.session.quantities[notAllowedWithItem]);
            if (!blockedFromAdding && (!maxQuantity || req.session.quantities[itemID] < maxQuantity)) {
                req.session.quantities[itemID] = req.session.quantities[itemID] + 1;
            }
        } else {
            if (req.session.quantities[itemID] !== 0) {
                req.session.quantities[itemID] = req.session.quantities[itemID] - 1;
            }
        }
        res.format({
            html: function () {
                res.redirect(req.baseUrl + PATHS.freeMaterials);
            },
            json: function () {
                res.send({
                    status: 'success',
                    data: req.session.quantities[itemID],
                    all: req.session.quantities
                });
            }
        });
    });

// help with publicity page
router.get(PATHS.helpWithPublicity, (req, res, next) => {
    res.render('pages/funding/guidance/help-with-publicity', {
        title: "Tell the world about your grant via social media"
    });
});

module.exports = router;
