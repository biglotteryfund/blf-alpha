const Raven = require('raven');
const config = require('config');
const moment = require('moment');
const { get } = require('lodash');
const { body, validationResult } = require('express-validator/check');
const { sanitizeBody } = require('express-validator/filter');
const xss = require('xss');

const ordersService = require('../../services/orders');
const mail = require('../../modules/mail');
const cached = require('../../middleware/cached');
const getSecret = require('../../modules/get-secret');

const freeMaterialsLogic = {
    formFields: require('./free-materials/formFields'),
    modifyItems: require('./free-materials/modifyItems'),
    materials: require('../../config/content/materials.json'),
    orderKey: 'orderedMaterials'
};

function init({ router, routeConfig }) {
    // handle adding/removing items
    router
        .route(routeConfig.path + '/item/:id')
        .post([sanitizeBody('action').escape(), sanitizeBody('code').escape()], cached.noCache, (req, res) => {
            // update the session with ordered items
            const code = req.body.code;

            freeMaterialsLogic.modifyItems(req, freeMaterialsLogic.orderKey, code);

            // handle ajax/standard form updates
            res.format({
                html: () => {
                    req.session.save(() => {
                        res.redirect(req.baseUrl + routeConfig.path);
                    });
                },
                json: () => {
                    req.session.save(() => {
                        res.send({
                            status: 'success',
                            quantity: get(req.session, [freeMaterialsLogic.orderKey, code, 'quantity'], 0),
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
        .route([routeConfig.path])
        .get(cached.csrfProtection, (req, res) => {
            let orderStatus;
            // clear order details if it succeeded
            if (req.flash('materialFormSuccess')) {
                orderStatus = 'success';
                delete req.session[freeMaterialsLogic.orderKey];
            } else if (req.flash('materialFormError')) {
                orderStatus = 'fail';
            }

            let lang = req.i18n.__(routeConfig.lang);
            let orders = req.session[freeMaterialsLogic.orderKey];
            let numOrders = 0;
            if (orders) {
                for (let o in orders) {
                    numOrders += orders[o].quantity;
                }
            }

            res.render(routeConfig.template, {
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
        .post(validators, cached.csrfProtection, (req, res) => {
            // sanitise input
            for (let key in req.body) {
                req.body[key] = xss(req.body[key]);
            }

            function storeOrderData(items, details) {
                // format ordered items for database
                let orderedItems = [];
                for (let code in items) {
                    if (items[code].quantity > 0) {
                        orderedItems.push({
                            code: code,
                            quantity: items[code].quantity
                        });
                    }
                }

                // work out the postcode area
                let postcodeArea = details.yourPostcode.replace(/ /g, '').toUpperCase();
                if (postcodeArea.length > 3) {
                    postcodeArea = postcodeArea.slice(0, -3);
                }

                // save order data to database
                return ordersService.storeOrder({
                    grantAmount: details.yourGrantAmount,
                    postcodeArea: postcodeArea,
                    items: orderedItems
                });
            }

            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                req.flash('formErrors', errors.array());
                req.flash('formValues', req.body);

                req.session.save(() => {
                    // build a redirect URL based on the route, the language of items,
                    // and the form anchor, so the user sees the form again via JS
                    let returnUrl = req.baseUrl + routeConfig.path;
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
                    // some fields are optional so matchedData misses them here
                    const details = req.body;
                    const items = req.session[freeMaterialsLogic.orderKey];
                    const dateNow = moment().format('dddd, MMMM Do YYYY, h:mm:ss a');
                    const text = makeOrderText(items, details);

                    let sendOrderEmail = mail.send({
                        subject: `Order from Big Lottery Fund website - ${dateNow}`,
                        text: text,
                        sendTo: process.env.MATERIAL_SUPPLIER || getSecret('emails.materials.supplier'),
                        sendMode: 'bcc'
                    });

                    let redirectToMessage = () => {
                        req.flash('showOverlay', true);
                        req.session.save(() => {
                            res.redirect(req.baseUrl + routeConfig.path);
                        });
                    };

                    sendOrderEmail
                        .then(() => {
                            if (config.get('storeOrderData')) {
                                // log this order in the database
                                storeOrderData(items, details)
                                    .then(() => {
                                        // successfully stored order data
                                        req.flash('materialFormSuccess', true);
                                        redirectToMessage();
                                    })
                                    .catch(error => {
                                        // error storing order data
                                        Raven.captureMessage('Error logging material order in database', {
                                            extra: error,
                                            tags: {
                                                feature: 'material-form'
                                            }
                                        });
                                        // this error doesn't affect the user so return a success to them
                                        req.flash('materialFormSuccess', true);
                                        redirectToMessage();
                                    });
                            } else {
                                req.flash('materialFormSuccess', true);
                                redirectToMessage();
                            }
                        })
                        .catch(() => {
                            // email to supplier failed to send - prompt user to try again
                            req.flash('materialFormError', true);
                            redirectToMessage();
                        });
                }
            }
        });
}

module.exports = {
    init
};
