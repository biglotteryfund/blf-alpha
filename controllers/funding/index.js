'use strict';
const express = require('express');
const router = express.Router();
const moment = require('moment');
const _ = require('lodash');
const xss = require('xss');
const config = require('config');
const { body, validationResult } = require('express-validator/check');
const { matchedData, sanitizeBody } = require('express-validator/filter');
const middleware = require('../../modules/middleware-helpers');
const routeStatic = require('../utils/routeStatic');

const mail = require('../../modules/mail');
const programmesRoute = require('./programmes');

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
    router
        .route(freeMaterials.path + '/item/:id')
        .post([sanitizeBody('action').escape(), sanitizeBody('code').escape()], middleware.noCache, (req, res) => {
            // update the session with ordered items
            const code = req.body.code;

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

    /**
     * Validate fields using custom validator
     * https://github.com/ctavan/express-validator#customvalidator
     * @TODO: There should definitely be a better way to model error translations
     */
    const validators = freeMaterialsLogic.formFields.filter(field => field.required).map(field => {
        return body(field.name)
            .exists()
            .custom((value, { req }) => {
                const locale = req.i18n.getLocale();
                // Turn 'Your name' into 'your name' (for error messages)
                const lcfirst = str => str[0].toLowerCase() + str.substring(1);
                // Get a translated error message
                let fieldName = lcfirst(field.label[locale]);
                let errorMessage = req.i18n.__('global.forms.missingFieldError', fieldName);
                // Validate field
                if (!value || value.length < 1) {
                    throw new Error(errorMessage);
                }

                return true;
            });
    });

    /**
     * Create text for order email
     */
    const makeOrderText = (items, details) => {
        let text = 'A new order has been received from the Big Lottery Fund website. The order details are below:\n\n';
        for (let code in items) {
            if (items[code].quantity > 0) {
                text += `\t- x${items[code].quantity} ${code}\t (item: ${items[code].name})\n`;
            }
        }
        text += "\nThe customer's personal details are below:\n\n";

        freeMaterialsLogic.formFields.forEach(field => {
            const fieldDetail = details[field.name];
            if (fieldDetail) {
                text += `\t${field.label['en']}: ${fieldDetail}\n\n`;
            }
        });

        text += '\nThis email has been automatically generated from the Big Lottery Fund Website.';
        text += '\nIf you have feedback, please contact matt.andrews@biglotteryfund.org.uk.';
        return text;
    };

    // PAGE: free materials form
    router
        .route([freeMaterials.path])
        .get(middleware.csrfProtection, (req, res) => {
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
                csrfToken: req.csrfToken()
            });
        })
        .post(validators, middleware.csrfProtection, (req, res) => {
            // sanitise input
            for (let key in req.body) {
                req.body[key] = xss(req.body[key]);
            }

            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                req.flash('formErrors', errors.array());
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
                /**
                 * Allow tests to run without sending email
                 * this is only used in tests, so we confirm the form data was correct
                 */
                if (req.body.skipEmail) {
                    res.send(req.body);
                } else {
                    const details = matchedData(req, { locations: ['body'] });
                    const dateNow = moment().format('dddd, MMMM Do YYYY, h:mm:ss a');
                    const text = makeOrderText(req.session[freeMaterialsLogic.orderKey], details);

                    mail.send({
                        subject: `Order from Big Lottery Fund website - ${dateNow}`,
                        text: text,
                        sendTo: config.get('materialSupplierEmail'),
                        sendMode: 'bcc'
                    });

                    req.flash('materialFormSuccess', true);
                    req.flash('showOverlay', true);

                    req.session.save(() => {
                        res.redirect(req.baseUrl + freeMaterials.path);
                    });
                }
            }
        });

    /**
     * Funding programme list
     */
    const programmesConfig = pages.programmes;
    router.get(programmesConfig.path, programmesRoute(programmesConfig));

    return router;
};
