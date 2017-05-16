'use strict';
const express = require('express');
const router = express.Router();
const materials = require('../config/content/materials.json');

// serve a static page (eg. no special dependencies)
const routeStaticPage = (page) => {
    // redirect any aliases to the canonical path
    if (page.aliases) {
        router.get(page.aliases, (req, res, next) => {
            res.redirect(req.baseUrl + page.path);
        });
    }

    // serve the canonical path with the supplied template
    router.get(page.path, (req, res, next) => {
        let lang = req.i18n.__(page.lang);
        res.render(page.template, {
            title: lang.title,
            copy: lang
        });
    });
};

module.exports = (pages) => {

    // populate static pages
    for (let page in pages) {
        if (pages[page].static) { routeStaticPage(pages[page]); }
    }

    // manually specify any non-static pages

    const freeMaterials = pages.freeMaterials;

    router.route([freeMaterials.path, '/test'])
        .get((req, res, next) => {
            // this page is dynamic so don't cache it
            res.cacheControl = { maxAge: 0 };
            let errors = (req.session.errors) ? req.session.errors : false;
            let values = (req.session.values) ? req.session.values: false;
            delete req.session.errors;
            delete req.session.values;
            let lang = req.i18n.__(freeMaterials.lang);
            res.render(freeMaterials.template, {
                title: lang.title,
                copy: lang,
                description: "Order items free of charge to acknowledge your grant",
                materials: materials.items,
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
                    // res.redirect(req.baseUrl + freeMaterials.path);
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
                res.redirect(req.baseUrl + freeMaterials.path);
            } else {
                res.send(req.body);
            }
        });
    });


    return router;
};