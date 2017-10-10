'use strict';
const express = require('express');
const router = express.Router();
const moment = require('moment');
const _ = require('lodash');
const xss = require('xss');

const routeStatic = require('../utils/routeStatic');
const email = require('../../modules/mail');
const contentApi = require('../../modules/content');

const freeMaterialsLogic = {
    formFields: require('./free-materials/formFields'),
    modifyItems: require('./free-materials/modifyItems'),
    materials: require('../../config/content/materials.json'),
    orderKey: 'orderedMaterials'
};

module.exports = (pages, sectionPath, sectionId) => {
    /**
     * 1. Populate static pages
     */
    routeStatic.initRouting(pages, router, sectionPath, sectionId);

    /**
     * 2. Manually specify any non-static pages
     */

    // PAGE: free materials update endpoint
    const freeMaterials = pages.freeMaterials;

    // handle adding/removing items
    router.route(freeMaterials.path + '/item/:id').post((req, res) => {
        // this page is dynamic so don't cache it
        res.cacheControl = { maxAge: 0 };

        // update the session with ordered items
        const code = req.sanitize('code').escape();
        freeMaterialsLogic.modifyItems(req, freeMaterialsLogic.orderKey, code);

        // handle ajax/standard form updates
        res.format({
            html: () => {
                req.session.save(() => {
                    res.redirect(req.baseUrl + freeMaterials.path);
                });
            },
            json: () => {
                req.session.save(() => {
                    res.send({
                        status: 'success',
                        quantity: _.get(req.session, [freeMaterialsLogic.orderKey, code, 'quantity'], 0),
                        allOrders: req.session[freeMaterialsLogic.orderKey]
                    });
                });
            }
        });
    });

    // PAGE: free materials form
    router
        .route([freeMaterials.path])
        .get((req, res) => {
            // this page is dynamic so don't cache it
            res.cacheControl = { maxAge: 0 };

            let orderStatus;
            // clear order details if it succeeded
            if (req.flash('materialFormSuccess')) {
                orderStatus = 'success';
                delete req.session[freeMaterialsLogic.orderKey];
            }

            let lang = req.i18n.__(freeMaterials.lang);
            let orders = req.session[freeMaterialsLogic.orderKey];
            let numOrders = 0;
            if (orders) {
                for (let o in orders) {
                    numOrders += orders[o].quantity;
                }
            }
            res.render(freeMaterials.template, {
                title: lang.title,
                copy: lang,
                description: 'Order items free of charge to acknowledge your grant',
                materials: freeMaterialsLogic.materials.items,
                formFields: freeMaterialsLogic.formFields,
                orders: orders,
                numOrders: numOrders,
                orderStatus: orderStatus,
                csrfToken: ''
            });
        })
        .post((req, res) => {
            // turn 'Your name' into 'your name' (for error messages)
            const lcfirst = str => str[0].toLowerCase() + str.substring(1);
            let locale = req.i18n.getLocale();

            freeMaterialsLogic.formFields.forEach(field => {
                if (field.required) {
                    // get a translated error message
                    let fieldName = lcfirst(field.label[locale]);
                    let errorMessage = req.i18n.__('global.forms.missingFieldError', fieldName);
                    req.checkBody(field.name, errorMessage).notEmpty();
                }
            });

            const makeOrderText = (items, details) => {
                let text =
                    'A new order has been received from the Big Lottery Fund website. The order details are below:\n\n';
                for (let code in items) {
                    if (items[code].quantity > 0) {
                        text += `\t- x${items[code].quantity} ${code}\t (item: ${items[code].name})\n`;
                    }
                }
                text += "\nThe customer's personal details are below:\n\n";

                freeMaterialsLogic.formFields.forEach(field => {
                    if (details[field.name]) {
                        let safeField = req.sanitize(field.name).unescape();
                        text += `\t${field.label['en']}: ${safeField}\n\n`;
                    }
                });

                text += '\nThis email has been automatically generated from the Big Lottery Fund Website.';
                text += '\nIf you have feedback, please contact matt.andrews@biglotteryfund.org.uk.';
                return text;
            };

            req.getValidationResult().then(result => {
                // sanitise input
                for (let key in req.body) {
                    req.body[key] = xss(req.body[key]);
                }

                if (!result.isEmpty()) {
                    req.flash('formErrors', result.array());
                    req.flash('formValues', req.body);
                    req.session.save(() => {
                        // build a redirect URL based on the route, the language of items,
                        // and the form anchor, so the user sees the form again via JS
                        let returnUrl = req.baseUrl + freeMaterials.path;
                        let formAnchor = '#your-details';
                        let langParam = '?lang=';
                        let redirectUrl = returnUrl;

                        // add their langage choice (if valid)
                        let langChoice = req.body.languageChoice;
                        if (
                            langChoice &&
                            redirectUrl.indexOf(langParam) === -1 &&
                            ['monolingual', 'bilingual'].indexOf(langChoice) !== -1
                        ) {
                            redirectUrl += langParam + langChoice;
                        }

                        // add the form anchor (if not present)
                        if (redirectUrl.indexOf(formAnchor) === -1) {
                            redirectUrl += formAnchor;
                        }

                        res.redirect(redirectUrl);
                    });
                } else {
                    let text = makeOrderText(req.session[freeMaterialsLogic.orderKey], req.body);
                    let dateNow = moment().format('dddd, MMMM Do YYYY, h:mm:ss a');

                    // allow tests to run without sending email
                    if (!req.body.skipEmail) {
                        email.send(text, `Order from Big Lottery Fund website - ${dateNow}`);
                        req.flash('materialFormSuccess', true);
                        req.flash('showOverlay', true);
                        req.session.save(() => {
                            res.redirect(req.baseUrl + freeMaterials.path);
                        });
                    } else {
                        // this is only used in tests, so we confirm the form data was correct
                        res.send(req.body);
                    }
                }
            });
        });

    // funding programme list
    let programmes = pages.programmes;
    router.get(programmes.path, (req, res) => {
        let lang = req.i18n.__(programmes.lang);

        contentApi
            .getFundingProgrammes(req.i18n.getLocale())
            .then(response => {
                res.render(programmes.template, {
                    title: lang.title,
                    copy: lang,
                    programmes: response.data
                });
            })
            .catch(err => {
                console.log('error', err);
                res.send(err);
            });
    });

    return router;
};
