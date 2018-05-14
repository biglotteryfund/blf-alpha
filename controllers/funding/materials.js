'use strict';
const { validationResult } = require('express-validator/check');
const { get, map, mapValues, reduce, set, some, sumBy, values } = require('lodash');
const { purify } = require('../../modules/validators');
const { sanitizeBody } = require('express-validator/filter');
const flash = require('req-flash');
const moment = require('moment');
const Raven = require('raven');

const { FORM_STATES } = require('../../modules/forms');
const { MATERIAL_SUPPLIER } = require('../../modules/secrets');
const { materialFields, makeOrderText, postcodeArea } = require('./materials-helpers');
const appData = require('../../modules/appData');
const cached = require('../../middleware/cached');
const mail = require('../../modules/mail');
const ordersService = require('../../services/orders');
const contentApi = require('../../services/content-api');

const sessionOrderKey = 'materialOrders';
const sessionBlockedItemKey = 'materialBlockedItem';


function modifyItems(req) {
    const validActions = ['increase', 'decrease'];

    const action = req.body.action;
    const productId = parseInt(req.body.productId);
    const materialId = parseInt(req.body.materialId);
    const maxQuantity = parseInt(req.body.max);
    const notAllowedWith = req.body.notAllowedWith ? req.body.notAllowedWith.split(',').map(i => parseInt(i)) : false;

    const isValidAction = validActions.indexOf(action) !== -1;

    // create the basket if empty
    if (!req.session[sessionOrderKey]) {
        req.session[sessionOrderKey] = [];
    }

    // Reset the blocker flag
    delete req.session[sessionBlockedItemKey];

    if (isValidAction) {

        let existingProduct = req.session[sessionOrderKey].find(order => order.productId === productId);

        // How many of the current item do they have?
        const currentItemQuantity = existingProduct ? existingProduct.quantity : 0;

        // Check if their current orders contain a blocker
        // note that this only works in one direction:
        // eg. it only checks if the product you're adding has constraints
        // eg. item A is blocked with item B (but you can add item B first, then add A)
        // solution is to make item A block item B and item B block item A in the CMS
        // or track the blocked items here and check both ends.
        const hasBlockerItem = some(req.session[sessionOrderKey], order => {
            if (!notAllowedWith) {
                return;
            }
            const itemIsBlocked = notAllowedWith.indexOf(order.materialId) !== -1;
            return itemIsBlocked && order.quantity > 0;
        });

        const noSpaceLeft = currentItemQuantity === maxQuantity;

        if (action === 'increase' && (hasBlockerItem || noSpaceLeft)) {
            // Alert the user that they're blocked from adding this item
            req.session[sessionBlockedItemKey] = true;
        } else if (!existingProduct) {
            req.session[sessionOrderKey].push({
                productId: productId,
                materialId: materialId,
                quantity: 1
            });
        } else {
            let q = existingProduct.quantity;
            existingProduct.quantity = (action === 'increase') ? q + 1 : q - 1;
        }

        // remove any empty orders
        req.session[sessionOrderKey] = req.session[sessionOrderKey].filter(o => o.quantity > 0);
    }
}

/**
 * Handle adding and removing items
 */
function initAddRemove({ router, routeConfig }) {
    const validators = [sanitizeBody('action').escape(), sanitizeBody('code').escape()];

    router.route(`${routeConfig.path}/update-basket`).post(validators, cached.noCache, (req, res) => {
        // Update the session with ordered items
        modifyItems(req);

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
                        orders: req.session[sessionOrderKey],
                        itemBlocked: req.session[sessionBlockedItemKey] || false
                    });
                });
            }
        });
    });

    return router;
}

function storeOrderSummary({ orderItems, orderDetails }) {
    const preparedOrderItems = reduce(
        orderItems,
        (acc, orderItem) => {
            if (orderItem.quantity > 0) {
                acc.push({
                    code: orderItem.code,
                    quantity: orderItem.quantity
                });
            }
            return acc;
        },
        []
    );

    const preparedOrderDetails = mapValues(orderDetails, (value, key) => {
        const field = get(materialFields, key);

        if (field) {
            const otherValue = get(orderDetails, field.name + 'Other');
            return field.allowOther && otherValue ? otherValue : value;
        } else {
            return value;
        }
    });

    return ordersService.storeOrder({
        grantAmount: preparedOrderDetails.yourGrantAmount,
        orderReason: preparedOrderDetails.yourReason,
        postcodeArea: postcodeArea(preparedOrderDetails.yourPostcode),
        items: preparedOrderItems
    });
}

async function injectMerchandise(req, res, next) {
    try {
        res.locals.availableItems = await contentApi.getMerchandise(req.i18n.getLocale());
        next();
    } catch (error) {
        next(error);
    }
}

/**
 * Initialise order form
 */
function initForm({ router, routeConfig }) {
    function renderForm(req, res, status = FORM_STATES.NOT_SUBMITTED) {
        const lang = req.i18n.__(routeConfig.lang);
        const availableItems = res.locals.availableItems;
        const orders = req.session[sessionOrderKey] || [];

        const formActionBase = '/' + res.locals.sectionId + routeConfig.path;

        res.render(routeConfig.template, {
            csrfToken: req.csrfToken(),
            copy: lang,
            title: lang.title,
            description: 'Order items free of charge to acknowledge your grant',
            materials: availableItems,
            formFields: materialFields,
            orders: orders,
            orderStatus: status,
            formActionBase: formActionBase
        });
    }

    const validators = map(materialFields, field => field.validator(field));

    router
        .route(routeConfig.path)
        // @TODO this will send a welsh email if user was on CY
        .all(cached.csrfProtection, injectMerchandise)
        .get((req, res) => {
            renderForm(req, res, FORM_STATES.NOT_SUBMITTED);
        })
        .post(validators, purify, (req, res) => {
            const errors = validationResult(req);

            if (errors.isEmpty()) {
                const details = req.body;
                const availableItems = res.locals.availableItems;

                const itemsToEmail = req.session[sessionOrderKey].map(item => {
                    const material = availableItems.find(i => i.itemId === item.materialId);
                    const product = material.products.find(p => p.id === item.productId);
                    return {
                        name: product.name ? product.name : material.title,
                        code: product.code,
                        quantity: item.quantity
                    };
                });

                const orderText = makeOrderText(itemsToEmail, details);

                storeOrderSummary({
                    orderItems: itemsToEmail,
                    orderDetails: details
                })
                    .then(() => {
                        const customerSendTo = details.yourEmail;
                        const supplierSendTo = appData.isNotProduction ? customerSendTo : MATERIAL_SUPPLIER;

                        const customerEmail = mail.generateAndSend([
                            {
                                name: 'material_customer',
                                sendTo: customerSendTo,
                                subject: 'Thank you for your Big Lottery Fund order',
                                templateName: 'emails/newMaterialOrder',
                                templateData: {}
                            }
                        ]);

                        const supplierEmail = mail.send({
                            name: 'material_supplier',
                            subject: `Order from Big Lottery Fund website - ${moment().format(
                                'dddd, MMMM Do YYYY, h:mm:ss a'
                            )}`,
                            text: orderText,
                            sendTo: supplierSendTo,
                            sendMode: 'bcc'
                        });

                        return Promise.all([customerEmail, supplierEmail]).then(() => {
                            // Clear order details if successful
                            delete req.session[sessionOrderKey];
                            delete req.session[sessionBlockedItemKey];
                            req.session.save(() => {
                                renderForm(req, res, FORM_STATES.SUBMISSION_SUCCESS);
                            });
                        });
                    })
                    .catch(err => {
                        Raven.captureException(err);
                        renderForm(req, res, FORM_STATES.SUBMISSION_ERROR);
                    });
            } else {
                req.flash('formErrors', errors.array());
                req.flash('formValues', req.body);

                req.session.save(() => {
                    // build a redirect URL based on the route, the language of items,
                    // and the form anchor, so the user sees the form again via JS
                    let redirectUrl = req.baseUrl + routeConfig.path;
                    let formAnchor = '#your-details';
                    let langParam = '?lang=';

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
            }
        });

    return router;
}

function init({ router, routeConfig }) {
    router.use(flash());

    initAddRemove({
        router,
        routeConfig
    });

    initForm({
        router,
        routeConfig
    });
}

module.exports = {
    init
};
