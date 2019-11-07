'use strict';
const path = require('path');
const express = require('express');
const moment = require('moment');
const Postcode = require('postcode');
const pick = require('lodash/pick');
const some = require('lodash/some');
const Sentry = require('@sentry/node');
const { oneLine } = require('common-tags');

const { Order } = require('../../db/models');
const contentApi = require('../../common/content-api');
const { isNotProduction } = require('../../common/appData');
const { csrfProtection, noStore } = require('../../common/cached');
const { generateHtmlEmail, sendEmail } = require('../../common/mail');
const { injectListingContent } = require('../../common/inject-content');
const { MATERIAL_SUPPLIER } = require('../../common/secrets');
const { sanitiseRequestBody } = require('../../common/sanitise');

const { fields, validate } = require('./lib/material-fields');
const makeOrderText = require('./lib/make-order-text');
const normaliseUserInput = require('./lib/normalise-user-input');

const router = express.Router();

const FORM_STATES = {
    NOT_SUBMITTED: 'NOT_SUBMITTED',
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    SUBMISSION_ERROR: 'SUBMISSION_ERROR',
    SUBMISSION_SUCCESS: 'SUBMISSION_SUCCESS'
};

const sessionOrderKey = 'materialOrders';
const sessionBlockedItemKey = 'materialBlockedItem';

function renderForm(
    req,
    res,
    status = FORM_STATES.NOT_SUBMITTED,
    data = null,
    errors = []
) {
    const lang = req.i18n.__('funding.guidance.order-free-materials');
    const availableItems = res.locals.availableItems;
    const orders = req.session[sessionOrderKey] || [];

    res.render(path.resolve(__dirname, './views/materials'), {
        copy: lang,
        breadcrumbs: res.locals.breadcrumbs.concat({
            label: res.locals.content.title
        }),
        csrfToken: req.csrfToken(),
        materials: availableItems,
        formFields: fields,
        orders: orders,
        orderStatus: status,
        formActionBase: req.baseUrl,
        formAnchorName: 'your-details',
        formValues: data,
        formErrors: errors,
        FORM_STATES
    });
}

function itemForEmail(availableItems, item) {
    const material = availableItems.find(i => i.itemId === item.materialId);
    const product = material.products.find(p => p.id === item.productId);

    return {
        name: product.name ? product.name : material.title,
        code: product.code,
        quantity:
            item.quantity > material.maximum ? material.maximum : item.quantity
    };
}

function getFieldValue(userData, fieldName) {
    const field = normaliseUserInput(userData).find(
        item => item.key === fieldName
    );

    return field ? field.value : null;
}

async function handleSubmission(req, res) {
    const userData = sanitiseRequestBody(req.body);
    const validationResult = validate(userData, req.i18n.getLocale());

    if (validationResult.isValid) {
        const itemsToEmail = req.session[sessionOrderKey].map(item => {
            return itemForEmail(res.locals.availableItems, item);
        });

        const orderText = makeOrderText(itemsToEmail, userData);

        try {
            await Order.storeOrder({
                grantAmount: getFieldValue(userData, 'yourGrantAmount'),
                orderReason: getFieldValue(userData, 'yourReason'),
                postcodeArea: Postcode.toOutcode(
                    getFieldValue(userData, 'yourPostcode')
                ),
                items: itemsToEmail
                    .filter(item => item.quantity > 0)
                    .map(item => pick(item, ['code', 'quantity']))
            });

            const customerHtml = await generateHtmlEmail({
                template: path.resolve(__dirname, './views/order-email.njk'),
                templateData: {
                    locale: req.i18n.getLocale(),
                    copy: req.i18n.__('materials.orderEmail')
                }
            });

            await Promise.all([
                sendEmail({
                    name: 'material_customer',
                    mailConfig: {
                        sendTo: userData.yourEmail,
                        subject: oneLine`Thank you for your The National
                                Lottery Community Fund order`,
                        type: 'html',
                        content: customerHtml
                    }
                }),
                sendEmail({
                    name: 'material_supplier',
                    mailConfig: {
                        sendTo: isNotProduction
                            ? userData.yourEmail
                            : MATERIAL_SUPPLIER,
                        sendMode: 'bcc',
                        subject: oneLine`Order from The National Lottery
                                Community Fund website - ${moment().format(
                                    'dddd, MMMM Do YYYY, h:mm:ss a'
                                )}`,
                        type: 'text',
                        content: orderText
                    }
                })
            ]);

            delete req.session[sessionOrderKey];
            delete req.session[sessionBlockedItemKey];
            req.session.save(() => {
                renderForm(req, res, FORM_STATES.SUBMISSION_SUCCESS);
            });
        } catch (err) {
            Sentry.captureException(err);
            renderForm(req, res, FORM_STATES.SUBMISSION_ERROR);
        }
    } else {
        renderForm(
            req,
            res,
            FORM_STATES.VALIDATION_ERROR,
            validationResult.value,
            validationResult.messages
        );
    }
}

router
    .route('/')
    .all(csrfProtection, injectListingContent, async function(req, res, next) {
        try {
            res.locals.availableItems = await contentApi.getMerchandise({
                locale: req.i18n.getLocale()
            });
            next();
        } catch (error) {
            next(error);
        }
    })
    .get(function(req, res) {
        renderForm(req, res, FORM_STATES.NOT_SUBMITTED);
    })
    .post(handleSubmission);

/**
 * Handle adding and removing items
 */
router.post('/update-basket', noStore, function(req, res) {
    const userData = sanitiseRequestBody(req.body);
    // Update the session with ordered items
    const validActions = ['increase', 'decrease'];

    const action = userData.action;
    const productId = parseInt(userData.productId);
    const materialId = parseInt(userData.materialId);
    const maxQuantity = parseInt(userData.max);
    const notAllowedWith = userData.notAllowedWith
        ? userData.notAllowedWith.split(',').map(i => parseInt(i))
        : false;

    const isValidAction = validActions.indexOf(action) !== -1;

    // create the basket if empty
    if (!req.session[sessionOrderKey]) {
        req.session[sessionOrderKey] = [];
    }

    // Reset the blocker flag
    delete req.session[sessionBlockedItemKey];

    if (isValidAction) {
        let existingProduct = req.session[sessionOrderKey].find(
            order => order.productId === productId
        );

        // How many of the current item do they have?
        const currentItemQuantity = existingProduct
            ? existingProduct.quantity
            : 0;

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
            const itemIsBlocked =
                notAllowedWith.indexOf(order.materialId) !== -1;
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
        req.session[sessionOrderKey] = req.session[sessionOrderKey].filter(
            o => o.quantity > 0
        );
    }

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
});

module.exports = router;
