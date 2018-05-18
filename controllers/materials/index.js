'use strict';
const { validationResult } = require('express-validator/check');
const { get, some } = require('lodash');
const { filter } = require('lodash/fp');
const { purify } = require('../../modules/validators');
const { sanitizeBody, matchedData } = require('express-validator/filter');
const moment = require('moment');
const Raven = require('raven');

const { FORM_STATES } = require('../../modules/forms');
const { injectCopy, injectListingContent, injectMerchandise } = require('../../middleware/inject-content');
const { makeOrderText } = require('./materials-helpers');
const { MATERIAL_SUPPLIER } = require('../../modules/secrets');
const appData = require('../../modules/appData');
const cached = require('../../middleware/cached');
const formStep = require('./materials-form');
const mail = require('../../modules/mail');
const ordersService = require('../../services/orders');

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
            existingProduct.quantity = action === 'increase' ? q + 1 : q - 1;
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

/**
 * Initialise order form
 */
function initForm({ router, routeConfig }) {
    function renderForm({ req, res, status = FORM_STATES.NOT_SUBMITTED }) {
        const { content, availableItems } = res.locals;
        const orders = req.session[sessionOrderKey] || [];
        const formActionBase = req.baseUrl + routeConfig.path;

        const formData = get(req.session, 'materials.formData');
        const formErrors = get(req.session, 'materials.formErrors');

        res.render(routeConfig.template, {
            content: content,
            title: content.title,
            heroImage: content.hero,
            step: formStep.withValues(formData),
            csrfToken: req.csrfToken(),
            materials: availableItems,
            orders: orders,
            orderStatus: status,
            formActionBase,
            data: formData,
            errors: formErrors
        });
    }

    function summariseOrderItems(orderItems, availableItems) {
        return filter(item => item.quantity > 0)(orderItems).map(item => {
            const material = availableItems.find(i => i.itemId === item.materialId);
            const product = material.products.find(p => p.id === item.productId);

            if (item.quantity > material.maximum) {
                item.quantity = material.maximum;
            }

            return {
                name: product.name ? product.name : material.title,
                code: product.code,
                quantity: item.quantity
            };
        });
    }

    router
        .route(routeConfig.path)
        .all(cached.csrfProtection, injectCopy(routeConfig), injectListingContent)
        .get(injectMerchandise(), (req, res) => {
            renderForm({ req, res, status: FORM_STATES.NOT_SUBMITTED });
        })
        .post(injectMerchandise({ locale: 'en' }), formStep.getValidators(), purify, (req, res) => {
            const { availableItems } = res.locals;
            const errors = validationResult(req);
            const orderDetails = req.body;
            const orderItemsSession = req.session[sessionOrderKey];
            const formStepWithValues = formStep.withValues(orderDetails);

            if (errors.isEmpty()) {
                const orderItems = summariseOrderItems(orderItemsSession, availableItems);
                const orderText = makeOrderText(orderItems, formStepWithValues.getFields());

                ordersService
                    .storeOrder({ orderItems, orderDetails })
                    .then(() => {
                        const customerSendTo = orderDetails.yourEmail;
                        const supplierSendTo = appData.isNotProduction ? customerSendTo : MATERIAL_SUPPLIER;

                        const customerEmail = mail.generateAndSend([
                            {
                                name: 'material_customer',
                                sendTo: customerSendTo,
                                subject: 'Thank you for your Big Lottery Fund order',
                                templateName: 'emails/newMaterialOrder',
                                templateData: {
                                    // @TODO work out why string-rendered templates don't inherit globals
                                    locale: req.i18n.getLocale()
                                }
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
                                renderForm({ req, res, status: FORM_STATES.SUBMISSION_SUCCESS });
                            });
                        });
                    })
                    .catch(err => {
                        Raven.captureException(err);
                        renderForm({ req, res, status: FORM_STATES.SUBMISSION_ERROR });
                    });
            } else {
                req.session['materials.formData'] = matchedData(req, { locations: ['body'] });
                req.session['materials.formErrors'] = errors.array();

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
