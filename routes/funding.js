'use strict';
const express = require('express');
const router = express.Router();
const _ = require('lodash');
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
    let orderKey = 'orderedMaterials';

    // handle adding/removing items
    router.route(freeMaterials.path + '/item/:id').post((req, res, next) => {
        const validActions = ['increase', 'decrease', 'remove'];
        const action = req.body.action;

        // @TODO sanitise
        // get form parameters
        const id = parseInt(req.params.id);
        const code = req.body.code;

        // look up the item they're adding
        const item = materials.items.find(i => i.id === id);

        // is this a valid item/action?
        if (item && validActions.indexOf(action) !== -1) {

            let maxQuantity = item.maximum;
            let notAllowedWithItemId = item.notAllowedWithItem;

            // get all their current orders
            let orders = _.get(req.session, [orderKey], {});

            // how many of the current item do they have?
            const currentItemQuantity = _.get(req.session, [orderKey, code, 'quantity'], 0);

            // store the ID of this item
            _.set(req.session, [orderKey, code, 'id'], id);

            // are they blocked from adding this item?
            let hasBlockerItem = false;

            if (notAllowedWithItemId) {
                // check if their current orders contain a blocker
                for (let code in orders) {
                    if (orders[code].id === notAllowedWithItemId) {
                        hasBlockerItem = true;
                    }
                }
            }

            // can they add more of this item?
            const noSpaceLeft = (currentItemQuantity === maxQuantity);

            if (action === 'increase') {
                if (!noSpaceLeft && !hasBlockerItem) {
                    _.set(req.session, [orderKey, code, 'quantity'], currentItemQuantity + 1);
                }
            } else if (currentItemQuantity > 1 && action === 'decrease') {
                _.set(req.session, [orderKey, code, 'quantity'], currentItemQuantity - 1);
            } else if (action === 'remove' || (action === 'decrease' && currentItemQuantity === 1)) {
                _.unset(req.session, [orderKey, code]);
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
                    quantity: _.get(req.session, [orderKey, code, 'quantity'], 0)
                });
            }
        });

    });

    router.route([freeMaterials.path, '/test'])
        .get((req, res, next) => {
            // this page is dynamic so don't cache it
            res.cacheControl = { maxAge: 0 };
            let errors = (req.session.errors) ? req.session.errors : false;
            let values = (req.session.values) ? req.session.values: false;

            let lang = req.i18n.__(freeMaterials.lang);
            res.render(freeMaterials.template, {
                title: lang.title,
                copy: lang,
                description: "Order items free of charge to acknowledge your grant",
                materials: materials.items,
                quantities: (req.session.quantities) ? req.session.quantities : {},
                formErrors: errors,
                values: values,
                orders: req.session[orderKey]
            });

            delete req.session.errors;
        })
        .post((req, res, next) => {
            req.checkBody('yourName', 'Please provide your name').notEmpty();
            req.checkBody('yourEmail', 'Please provide your email address').notEmpty();
            req.checkBody('yourNumber', 'Please provide your phone number').notEmpty();

            req.checkBody('yourAddress1', 'Please provide your address line 1').notEmpty();
            req.checkBody('yourAddress2', 'Please provide your address line 2').notEmpty();
            req.checkBody('yourTown', 'Please provide your town').notEmpty();
            req.checkBody('yourCounty', 'Please provide your county').notEmpty();
            req.checkBody('yourPostcode', 'Please provide your postcode').notEmpty();


            req.checkBody('yourProjectName', 'Please provide your project name').notEmpty();
            req.checkBody('yourProjectID', 'Please provide your project ID number').notEmpty();
            req.checkBody('yourGrantAmount', 'Please provide your grant amount').notEmpty();

            req.getValidationResult().then((result) => {
                if (!result.isEmpty()) {
                    req.session.errors = result.array();
                    req.session.values = req.body;
                    // res.redirect(req.baseUrl + freeMaterials.path);
                    res.redirect(req.baseUrl + '/test#your-details'); // @TODO make config item
                } else {
                    res.send(req.body);
                }
            });
        });

    return router;
};