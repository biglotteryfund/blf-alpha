'use strict';
const express = require('express');
const router = express.Router();
const moment = require('moment');
const _ = require('lodash');

const security = require('../boilerplate/security');
const email = require('../modules/mail');

const freeMaterialsLogic = {
    formFields: require('./free-materials/formFields'),
    modifyItems: require('./free-materials/modifyItems'),
    materials: require('../config/content/materials.json'),
    orderKey: 'orderedMaterials'
};

// @TODO eventually break this out into its own utility module
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

    /**
     * 1. Populate static pages
     */
    for (let page in pages) {
        if (pages[page].static) { routeStaticPage(pages[page]); }
    }

    /**
     * 2. Manually specify any non-static pages
     */

    // PAGE: free materials update endpoint
    const freeMaterials = pages.freeMaterials;
    // handle adding/removing items
    router.route(freeMaterials.path + '/item/:id').post((req, res, next) => {
        // this page is dynamic so don't cache it
        res.cacheControl = { maxAge: 0 };

        // update the session with ordered items
        const code = req.sanitize('code').escape();
        freeMaterialsLogic.modifyItems(req, freeMaterialsLogic.orderKey, code);

        // handle ajax/standard form updates
        res.format({
            html: function () {
                // res.redirect(req.baseUrl + freeMaterials.path);
                res.redirect(req.baseUrl + '/test');
            },
            json: function () {
                res.send({
                    status: 'success',
                    quantity: _.get(req.session, [freeMaterialsLogic.orderKey, code, 'quantity'], 0),
                    allOrders: req.session[freeMaterialsLogic.orderKey]
                });
            }
        });

    });

    // PAGE: free materials form
    router.get(freeMaterials.aliases, (req, res, next) => {
        res.redirect(req.baseUrl + freeMaterials.path);
    });

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
                delete req.session[freeMaterialsLogic.orderKey];
            }

            let lang = req.i18n.__(freeMaterials.lang);
            let orders = req.session[freeMaterialsLogic.orderKey];
            let numOrders = 0;
            if (orders) {
                for (let o in orders) { numOrders += orders[o].quantity; }
            }
            res.render(freeMaterials.template, {
                title: lang.title,
                copy: lang,
                description: "Order items free of charge to acknowledge your grant",
                materials: freeMaterialsLogic.materials.items,
                formFields: freeMaterialsLogic.formFields,
                formErrors: errors,
                orders: orders,
                numOrders: numOrders,
                orderStatus: orderStatus,
                csrfToken: ''
            });

            // @TODO flash session
            delete req.session.errors;
        })
        .post((req, res, next) => {

            const lcfirst = (str) => str[0].toLowerCase() + str.substring(1);

            freeMaterialsLogic.formFields.forEach(field => {
                if (field.required) {
                    // @TODO i18n
                    req.checkBody(field.name, 'Please provide ' + lcfirst(field.label['en'])).notEmpty();
                }
            });

            const makeOrderText = (items, details) => {
                let text = "A new order has been received from the Big Lottery Fund website. The order details are below:\n\n";
                for (let code in items) {
                    text += `\t- ${code}\t x${items[code].quantity}\n`;
                }
                text += "\nThe customer's personal details are below:\n\n";

                freeMaterialsLogic.formFields.forEach(field => {
                    if (details[field.name]) {
                        let safeField = req.sanitize(field.name).unescape();
                        text += `\t${field.label['en']}: ${safeField}\n\n`;
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
                    res.redirect(req.baseUrl + freeMaterials.path + '#your-details');
                } else {
                    let text = makeOrderText(req.session[freeMaterialsLogic.orderKey], req.body);
                    let dateNow = moment().format("dddd, MMMM Do YYYY, h:mm:ss a");
                    
                    // @TODO handle error here?
                    if (!req.body.skipEmail) { // allow tests to run without sending emeil
                        email.send(text, `Order from Big Lottery Fund website - ${dateNow}`);
                    }

                    req.session.materialFormSuccess = true;
                    req.session.showOverlay = true;
                    res.redirect(req.baseUrl + freeMaterials.path);
                }
            });
        });

    return router;
};