'use strict';
const { map, reduce, some } = require('lodash');
const { purify } = require('../../common/validators');
const { sanitizeBody } = require('express-validator/filter');
const { validationResult } = require('express-validator/check');
const express = require('express');
const moment = require('moment');
const path = require('path');
const Sentry = require('@sentry/node');

const router = express.Router();

const { injectBreadcrumbs, injectListingContent, injectMerchandise } = require('../../middleware/inject-content');
const { MATERIAL_SUPPLIER } = require('../../common/secrets');
const { materialFields, makeOrderText, postcodeArea, normaliseUserInput } = require('./helpers');
const appData = require('../../common/appData');
const cached = require('../../middleware/cached');
const { generateHtmlEmail, sendEmail } = require('../../common/mail');
const ordersService = require('../../services/orders');

const FORM_STATES = {
    NOT_SUBMITTED: 'NOT_SUBMITTED',
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    SUBMISSION_ERROR: 'SUBMISSION_ERROR',
    SUBMISSION_SUCCESS: 'SUBMISSION_SUCCESS'
};

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

    const preparedOrderDetails = normaliseUserInput(orderDetails);
    const getFieldValue = fieldName => {
        // some fields are optional and won't be here
        let field = preparedOrderDetails.find(d => d.key === fieldName);
        return field ? field.value : null;
    };

    return ordersService.storeOrder({
        grantAmount: getFieldValue('yourGrantAmount'),
        orderReason: getFieldValue('yourReason'),
        postcodeArea: postcodeArea(getFieldValue('yourPostcode')),
        items: preparedOrderItems
    });
}

function renderForm(req, res, status = FORM_STATES.NOT_SUBMITTED) {
    const lang = req.i18n.__('funding.guidance.order-free-materials');
    const availableItems = res.locals.availableItems;
    const orders = req.session[sessionOrderKey] || [];

    // @TODO: Remove this if/when migrating materials form fields to use new shared fields
    // Function for finding errors from a form array
    res.locals.getFormErrorForField = function(errorList, fieldName) {
        if (errorList && errorList.length > 0) {
            return errorList.find(e => e.param === fieldName);
        }
    };

    res.render(path.resolve(__dirname, './views/materials'), {
        copy: lang,
        csrfToken: req.csrfToken(),
        materials: availableItems,
        formFields: materialFields,
        orders: orders,
        orderStatus: status,
        formActionBase: req.baseUrl,
        formAnchorName: 'your-details',
        FORM_STATES
    });
}

router
    .route('/')
    .all(cached.csrfProtection, injectListingContent, injectBreadcrumbs)
    .get(injectMerchandise({}), (req, res) => {
        renderForm(req, res, FORM_STATES.NOT_SUBMITTED);
    })
    .post(
        injectMerchandise({ locale: 'en' }),
        map(materialFields, field => field.validator(field)),
        purify,
        (req, res) => {
            const errors = validationResult(req);

            if (errors.isEmpty()) {
                const details = req.body;
                const availableItems = res.locals.availableItems;

                const itemsToEmail = req.session[sessionOrderKey].map(item => {
                    const material = availableItems.find(i => i.itemId === item.materialId);
                    const product = material.products.find(p => p.id === item.productId);
                    // prevent someone who really loves plaques from hacking the form to increase the maximum
                    if (item.quantity > material.maximum) {
                        item.quantity = material.maximum;
                    }
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
                    .then(async () => {
                        const customerSendTo = details.yourEmail;
                        const supplierSendTo = appData.isNotProduction ? customerSendTo : MATERIAL_SUPPLIER;

                        const customerHtml = await generateHtmlEmail({
                            template: path.resolve(__dirname, './views/order-email.njk'),
                            templateData: {
                                locale: req.i18n.getLocale(),
                                copy: req.i18n.__('materials.orderEmail')
                            }
                        });

                        const customerEmail = sendEmail({
                            name: 'material_customer',
                            mailConfig: {
                                sendTo: customerSendTo,
                                subject: 'Thank you for your The National Lottery Community Fund order',
                                type: 'html',
                                content: customerHtml
                            }
                        });

                        const supplierEmail = sendEmail({
                            name: 'material_supplier',
                            mailConfig: {
                                sendTo: supplierSendTo,
                                sendMode: 'bcc',
                                subject: `Order from The National Lottery Community Fund website - ${moment().format(
                                    'dddd, MMMM Do YYYY, h:mm:ss a'
                                )}`,
                                type: 'text',
                                content: orderText
                            }
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
                        Sentry.captureException(err);
                        renderForm(req, res, FORM_STATES.SUBMISSION_ERROR);
                    });
            } else {
                // The form has failed validation
                res.locals.formErrors = errors.array();
                res.locals.formValues = req.body;
                renderForm(req, res, FORM_STATES.VALIDATION_ERROR);
            }
        }
    );

/**
 * Handle adding and removing items
 */
router.post(
    '/update-basket',
    [sanitizeBody('action').escape(), sanitizeBody('code').escape()],
    cached.noCache,
    (req, res) => {
        // Update the session with ordered items
        modifyItems(req);

        res.format({
            html: () => {
                req.session.save(() => {
                    res.redirect(req.baseUrl);
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
    }
);

module.exports = router;
