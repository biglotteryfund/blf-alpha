'use strict';
const path = require('path');
const express = require('express');
const moment = require('moment');
const Postcode = require('postcode');
const getOr = require('lodash/fp/getOr');
const pick = require('lodash/pick');
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

function renderForm(req, res, status = null, data = null, errors = []) {
    res.render(path.resolve(__dirname, './views/materials'), {
        copy: req.i18n.__('funding.guidance.order-free-materials'),
        breadcrumbs: res.locals.breadcrumbs.concat({
            label: res.locals.content.title
        }),
        csrfToken: req.csrfToken(),
        materials: res.locals.availableItems,
        formFields: fields,
        orders: req.session[sessionOrderKey] || [],
        orderStatus: status || FORM_STATES.NOT_SUBMITTED,
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

router.post('/update-basket', noStore, function(req, res) {
    const data = sanitiseRequestBody(req.body);
    const basket = getOr([], sessionOrderKey)(req.session);

    // Reset the blocker flag
    delete req.session[sessionBlockedItemKey];

    if (['increase', 'decrease'].includes(data.action)) {
        const existingProduct = basket.find(function(item) {
            return item.productId === parseInt(data.productId, 10);
        });

        const currentQuantity = getOr(0, 'quantity')(existingProduct);

        const blockedIds = data.notAllowedWith
            ? data.notAllowedWith.split(',').map(id => parseInt(id, 10))
            : [];

        /**
         * Check if their current orders contain a blocker
         * this only checks if the product you're adding has constraints
         * eg. item A is blocked with item B (but you can add item B first, then add A)
         */
        const hasBlockerItem = basket.some(function(order) {
            return blockedIds.includes(order.materialId) && order.quantity > 0;
        });

        const itemBlocked =
            hasBlockerItem || currentQuantity === parseInt(data.max, 10);

        if (data.action === 'increase' && itemBlocked) {
            req.session[sessionBlockedItemKey] = true;
        } else if (existingProduct) {
            existingProduct.quantity =
                data.action === 'increase'
                    ? existingProduct.quantity + 1
                    : existingProduct.quantity - 1;
        } else {
            basket.push({
                productId: parseInt(data.productId, 10),
                materialId: parseInt(data.materialId, 10),
                quantity: 1
            });
        }

        req.session[sessionOrderKey] = basket.filter(item => item.quantity > 0);
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
