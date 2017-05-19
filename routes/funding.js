'use strict';
const express = require('express');
const router = express.Router();
const _ = require('lodash');
const materials = require('../config/content/materials.json');
const email = require('../modules/mail');
const moment = require('moment');

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

        // get form parameters
        const id = parseInt(req.params.id);
        const code = req.sanitize('code').escape();
        const action = req.sanitize('action').escape();

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
                    _.set(req.session, [orderKey, code, 'id'], id);
                    _.set(req.session, [orderKey, code, 'quantity'], currentItemQuantity + 1);
                }
            } else if (currentItemQuantity > 1 && action === 'decrease') {
                _.set(req.session, [orderKey, code, 'id'], id);
                _.set(req.session, [orderKey, code, 'quantity'], currentItemQuantity - 1);
            } else if (action === 'remove' || (action === 'decrease' && currentItemQuantity === 1)) {
                _.unset(req.session, [orderKey, code]);
                if (Object.keys(req.session[orderKey]).length === 0) {
                    delete req.session[orderKey];
                }
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
                    quantity: _.get(req.session, [orderKey, code, 'quantity'], 0),
                    allOrders: req.session[orderKey]
                });
            }
        });

    });

    const formFields = [
        {
            name: 'yourName',
            type: 'text',
            required: true,
            label: 'Your Name'
        },
        {
            name: 'yourEmail',
            type: 'text',
            required: true,
            label: 'Your email address'
        },
        {
            name: 'yourNumber',
            type: 'text',
            required: true,
            label: 'Your phone number'
        },
        {
            name: 'yourAddress1',
            type: 'text',
            required: true,
            label: 'Your address line 1'
        },
        {
            name: 'yourAddress2',
            type: 'text',
            required: false,
            label: 'Your address line 2'
        },
        {
            name: 'yourTown',
            type: 'text',
            required: true,
            label: 'Your town/city'
        },
        {
            name: 'yourCounty',
            type: 'text',
            required: false,
            label: 'Your county'
        },
        {
            name: 'yourPostcode',
            type: 'text',
            required: true,
            label: 'Your Postcode'
        },
        {
            name: 'yourProjectName',
            type: 'text',
            required: true,
            label: 'Your project name'
        },
        {
            name: 'yourProjectID',
            type: 'text',
            required: true,
            label: 'Your project ID number'
        },
        {
            name: 'yourGrantAmount',
            type: 'text',
            required: true,
            label: 'Your grant amount'
        }
    ];

    // serve the materials page
    router.route([freeMaterials.path, '/test'])
        .get((req, res, next) => {

            // this page is dynamic so don't cache it
            res.cacheControl = { maxAge: 0 };
            let errors = (req.session.errors) ? req.session.errors : false;

            let orderStatus;
            if (req.session.materialFormSuccess) {
                orderStatus = 'success';
                req.session.showOverlay = true;
                delete req.session.materialFormSuccess;
                delete req.session.showOverlay;
                delete req.session[orderKey];
            }

            let lang = req.i18n.__(freeMaterials.lang);
            res.render(freeMaterials.template, {
                title: lang.title,
                copy: lang,
                description: "Order items free of charge to acknowledge your grant",
                materials: materials.items,
                formFields: formFields,
                formErrors: errors,
                orders: req.session[orderKey],
                orderStatus: orderStatus
            });

            // @TODO flash session
            delete req.session.errors;
        })
        .post((req, res, next) => {

            const lcfirst = (str) => str[0].toLowerCase() + str.substring(1);

            formFields.forEach(field => {
                if (field.required) {
                    req.checkBody(field.name, 'Please provide ' + lcfirst(field.label)).notEmpty();
                }
            });

            const makeOrderText = (items, details) => {
                let text = "A new order has been received from the Big Lottery Fund website. The order details are below:\n\n";
                for (let code in items) {
                    text += `\t- ${code}\t x${items[code].quantity}\n`;
                }
                text += "\nThe customer's personal details are below:\n\n";

                formFields.forEach(field => {
                    if (details[field.name]) {
                        let safeField = req.sanitize(field.name).escape();
                        text += `\t${field.label}: ${safeField}\n\n`;
                    }
                });

                text += "\nThis email has been automatically generated from the Big Lottery Fund Website.";
                text += "\nIf you have feedback, please contact matt.andrews@biglotteryfund.org.uk.";
                return text;
            };

            req.getValidationResult().then((result) => {
                // sanitise input
                for (let key in req.body) {
                    req.body[key] = req.sanitize(key).escape();
                }

                if (!result.isEmpty()) {
                    req.session.errors = result.array();
                    req.session.values = req.body;

                    // res.redirect(req.baseUrl + freeMaterials.path);
                    res.redirect(req.baseUrl + '/test#your-details'); // @TODO make config item
                } else {
                    let text = makeOrderText(req.session[orderKey], req.body);
                    let dateNow = moment().format("dddd, MMMM Do YYYY, h:mm:ss a");

                    // @TODO handle error here?
                    email.send(text, `Order from Big Lottery Fund website - ${dateNow}`);

                    req.session.materialFormSuccess = true;
                    req.session.showOverlay = true;
                    // res.redirect(req.baseUrl + freeMaterials.path);
                    res.redirect(req.baseUrl + '/test'); // @TODO make config item
                }
            });
        });

    return router;
};