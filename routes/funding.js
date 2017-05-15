'use strict';
const express = require('express');
const router = express.Router();
const materials = require('../config/content/materials.json');

const PATHS = {
    manageFunding:     '/funding-guidance/managing-your-funding',
    helpWithPublicity: '/funding-guidance/managing-your-funding/help-with-publicity',
    freeMaterials:     '/funding-guidance/managing-your-funding/ordering-free-materials',
    logoIndex:         '/funding-guidance/managing-your-funding/grant-acknowledgement-and-logos', // redirect only
    logoIndex2:        '/funding-guidance/managing-your-funding/logodownloads', // redirect only
    logoDownloads:     '/funding-guidance/managing-your-funding/grant-acknowledgement-and-logos/logodownloads'
};


// redirect logoIndex => logoDownloads
router.get([PATHS.logoIndex, PATHS.logoIndex2], (req, res, next) => {
    res.redirect(req.baseUrl + PATHS.logoDownloads);
});

// logo download page
router.get(PATHS.logoDownloads, (req, res, next) => {
    res.render('pages/funding/guidance/logos', {
        title: req.i18n.__("funding.guidance.logos.title"),
    });
});

// funding management page
router.get(PATHS.manageFunding, (req, res, next) => {
    res.render('pages/funding/guidance/managing-your-funding', {
        title: req.i18n.__("funding.guidance.managing-your-funding.title"),
        description: "We want you to be as flexible and creative as possible with using your grant money"
    });
});

// help with publicity page
router.get(PATHS.helpWithPublicity, (req, res, next) => {
    res.render('pages/funding/guidance/help-with-publicity', {
        title: req.i18n.__("funding.guidance.help-with-publicity.title"),
        description: "Social media channels such as Facebook, Twitter and Instagram are great ways of publicising your grant and the work that you do"
    });
});

// ordering free materials page
router.route([PATHS.freeMaterials, '/test'])
    .get((req, res, next) => {
        // this page is dynamic so don't cache it
        res.cacheControl = { maxAge: 0 };
        let errors = (req.session.errors) ? req.session.errors : false;
        let values = (req.session.values) ? req.session.values: false;
        delete req.session.errors;
        delete req.session.values;
        res.render('pages/funding/guidance/order-free-materials', {
            title: req.i18n.__("funding.guidance.order-free-materials.title"),
            description: "Order items free of charge to acknowledge your grant",
            materials: materials.categories,
            quantities: (req.session.quantities) ? req.session.quantities : {},
            formErrors: errors,
            values: values
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
                // res.redirect(req.baseUrl + PATHS.freeMaterials);
                res.redirect(req.baseUrl + '/test');
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

router.post('/order-materials', (req, res, next) => {
    req.checkBody('yourName', 'Please provide your name').notEmpty();
    req.checkBody('yourAddress', 'Please provide your address').notEmpty();
    req.checkBody('yourNumber', 'Please provide your phone number').notEmpty();
    req.checkBody('yourEmail', 'Please provide your email address').notEmpty();
    req.checkBody('yourProjectName', 'Please provide your project name').notEmpty();
    req.checkBody('yourProjectID', 'Please provide your project ID number').notEmpty();
    req.checkBody('yourGrantAmount', 'Please provide your grant amount').notEmpty();

    req.getValidationResult().then((result) => {
        if (!result.isEmpty()) {
            req.session.errors = result.array();
            req.session.values = req.body;
            res.redirect(req.baseUrl + PATHS.freeMaterials);
        } else {
            res.send(req.body);
        }
    });
});

module.exports = router;
