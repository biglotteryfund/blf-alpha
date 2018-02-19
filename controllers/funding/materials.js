const Raven = require('raven');
const moment = require('moment');
const { get } = require('lodash');
const { validationResult } = require('express-validator/check');
const { sanitizeBody } = require('express-validator/filter');
const xss = require('xss');
const app = require('../../server');

const ordersService = require('../../services/orders');
const mail = require('../../modules/mail');
const cached = require('../../middleware/cached');
const { EMAIL_MATERIALS_SUPPLIER } = require('../../modules/secrets');

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
                            allOrders: req.session[freeMaterialsLogic.orderKey],
                            itemBlocked: get(req.session, [freeMaterialsLogic.orderKey, 'itemBlocked'], false)
                        });
                    });
                }
            });
        });

    // combine all validators for each field
    let validators = [];
    for (let key in freeMaterialsLogic.formFields.fields) {
        let field = freeMaterialsLogic.formFields.fields[key];
        validators.push(field.validator(field));
    }

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

        for (let key in freeMaterialsLogic.formFields.fields) {
            let field = freeMaterialsLogic.formFields.fields[key];
            let fieldValue = details[field.name];
            const fieldLabel = field.emailKey;

            // did this order include "other" options?
            if (field.allowOther) {
                // did they enter something?
                let otherValue = details[field.name + 'Other'];
                if (otherValue) {
                    // override the field with their custom text
                    fieldValue = otherValue;
                    // update the original too
                    details[field.name] = otherValue;
                }
            }

            if (fieldValue) {
                text += `\t${fieldLabel}: ${fieldValue}\n\n`;
            }
        }

        text += '\nThis email has been automatically generated from the Big Lottery Fund website.';
        text += '\nIf you have feedback, please contact matt.andrews@biglotteryfund.org.uk.';

        return {
            text,
            details
        };
    };

    // PAGE: free materials form
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
                formFields: freeMaterialsLogic.formFields.fields,
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

            // get form errors and translate them
            const errors = validationResult(req).formatWith(error => {
                // not every field has a translated error (or an error at all)
                let isTranslateable = get(error, ['msg', 'translateable'], false);
                if (!isTranslateable) {
                    return error;
                }
                let errorMsg;
                let errorParam = error.msg.paramPath ? error.msg.paramPath : false;

                // does this translation require a parameter
                // (which must also be translated)?
                if (errorParam) {
                    let paramTranslated = req.i18n.__(error.msg.paramPath);
                    errorMsg = req.i18n.__(error.msg.errorPath, paramTranslated);
                } else {
                    errorMsg = req.i18n.__(error.msg.errorPath);
                }

                return Object.assign({}, error, {
                    msg: errorMsg
                });
            });

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
                    const orderText = makeOrderText(items, details);

                    let sendOrderEmail = mail.send({
                        subject: `Order from Big Lottery Fund website - ${dateNow}`,
                        text: orderText.text,
                        sendTo: EMAIL_MATERIALS_SUPPLIER,
                        sendMode: 'bcc'
                    });

                    // Email the customer to confirm their order.
                    // First render a Nunjucks template to a string
                    app.render('emails/newMaterialOrder', {}, (errorRenderingTemplate, html) => {
                        if (!errorRenderingTemplate) {
                            // Next, convert this string into inline-styled HTML
                            mail
                                .renderHtmlEmail(html)
                                .then(inlinedHtml => {
                                    mail.send({
                                        subject: `Thank you for your Big Lottery Fund order`,
                                        html: inlinedHtml,
                                        sendTo: req.body.yourEmail
                                    });
                                })
                                .catch(err => {
                                    Raven.captureMessage('Error converting template to inline CSS', {
                                        extra: err,
                                        tags: {
                                            feature: 'material-form'
                                        }
                                    });
                                });
                        }
                    });

                    let redirectToMessage = () => {
                        req.flash('showOverlay', true);
                        req.session.save(() => {
                            res.redirect(req.baseUrl + routeConfig.path);
                        });
                    };

                    let storeOrderData = (orderItems, orderDetails) => {
                        // format ordered items for database
                        let orderedItems = [];
                        for (let code in orderItems) {
                            if (orderItems[code].quantity > 0) {
                                orderedItems.push({
                                    code: code,
                                    quantity: orderItems[code].quantity
                                });
                            }
                        }

                        // work out the postcode area
                        let postcodeArea = orderDetails.yourPostcode.replace(/ /g, '').toUpperCase();
                        if (postcodeArea.length > 3) {
                            postcodeArea = postcodeArea.slice(0, -3);
                        }

                        // save order data to database
                        return ordersService.storeOrder({
                            grantAmount: orderDetails.yourGrantAmount,
                            orderReason: orderDetails.yourReason,
                            postcodeArea: postcodeArea,
                            items: orderedItems
                        });
                    };

                    sendOrderEmail
                        .then(() => {
                            // log this order in the database
                            storeOrderData(items, orderText.details)
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
