'use strict';
const { validationResult } = require('express-validator/check');
const { get, map, mapValues, reduce, set, some, sumBy, values } = require('lodash');
const { purify } = require('../../modules/validators');
const { sanitizeBody } = require('express-validator/filter');
const flash = require('req-flash');
const moment = require('moment');
const Raven = require('raven');

const { FORM_STATES } = require('../../modules/forms');
const { injectListingContent } = require('../../middleware/inject-content');
const { MATERIAL_SUPPLIER } = require('../../modules/secrets');
const { materialFields, makeOrderText, postcodeArea } = require('./materials-helpers');
const appData = require('../../modules/appData');
const cached = require('../../middleware/cached');
const mail = require('../../modules/mail');
const ordersService = require('../../services/orders');

const materials = require('../../config/content/materials.json');
const materialsOrderKey = 'orderedMaterials';
const availableItems = materials.items.filter(i => !i.disabled);

function modifyItems(req, orderKey, code) {
    const validActions = ['increase', 'decrease', 'remove'];
    const id = parseInt(req.params.id);
    const action = req.body.action;

    const itemToBeAdded = availableItems.find(i => i.id === id);
    const isValidAction = itemToBeAdded && validActions.indexOf(action) !== -1;

    if (isValidAction) {
        const maxQuantity = itemToBeAdded.maximum;
        const notAllowedWithItemId = itemToBeAdded.notAllowedWithItem;

        const allCurrentOrders = get(req.session, [orderKey], {});

        // How many of the current item do they have?
        const currentItemQuantity = get(req.session, [orderKey, code, 'quantity'], 0);

        // Check if their current orders contain a blocker
        const hasBlockerItem = some(allCurrentOrders, order => {
            return notAllowedWithItemId && order.id === notAllowedWithItemId && order.quantity > 0;
        });

        // Store the product name
        set(req.session, [orderKey, code, 'name'], itemToBeAdded.name.en);

        const noSpaceLeft = currentItemQuantity === maxQuantity;

        // Reset the blocker flag
        set(req.session, [orderKey, 'itemBlocked'], false);

        if (action === 'increase') {
            if (!noSpaceLeft && !hasBlockerItem) {
                set(req.session, [orderKey, code, 'id'], id);
                set(req.session, [orderKey, code, 'quantity'], currentItemQuantity + 1);
            } else {
                // Alert the user that they're blocked from adding this item
                set(req.session, [orderKey, 'itemBlocked'], true);
            }
        } else if (currentItemQuantity > 1 && action === 'decrease') {
            set(req.session, [orderKey, code, 'id'], id);
            set(req.session, [orderKey, code, 'quantity'], currentItemQuantity - 1);
        } else if (action === 'remove' || (action === 'decrease' && currentItemQuantity === 1)) {
            set(req.session, [orderKey, code, 'quantity'], 0);
        }
    }
}

/**
 * Handle adding and removing items
 */
function initAddRemove({ router, routeConfig }) {
    const validators = [sanitizeBody('action').escape(), sanitizeBody('code').escape()];

    router.route(`${routeConfig.path}/item/:id`).post(validators, cached.noCache, (req, res) => {
        const code = req.body.code;

        // Update the session with ordered items
        modifyItems(req, materialsOrderKey, code);

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
                        quantity: get(req.session, [materialsOrderKey, code, 'quantity'], 0),
                        allOrders: req.session[materialsOrderKey],
                        itemBlocked: get(req.session, [materialsOrderKey, 'itemBlocked'], false)
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
        (acc, orderItem, code) => {
            if (orderItem.quantity > 0) {
                acc.push({
                    code: code,
                    quantity: orderItems[code].quantity
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

/**
 * Initialise order form
 */
function initForm({ router, routeConfig }) {
    function renderForm(req, res, status = FORM_STATES.NOT_SUBMITTED) {
        const content = res.locals.content;
        const lang = req.i18n.__(routeConfig.lang);
        const orders = get(req.session, materialsOrderKey, {});
        const numOrders = sumBy(values(orders), order => {
            return order.quantity;
        });

        res.render(routeConfig.template, {
            copy: lang,
            content: content,
            title: content.title,
            heroImage: content.hero,
            csrfToken: req.csrfToken(),
            materials: availableItems,
            formFields: materialFields,
            orders: orders,
            numOrders: numOrders,
            orderStatus: status
        });
    }

    const validators = map(materialFields, field => field.validator(field));

    router
        .route(routeConfig.path)
        .all(cached.csrfProtection, injectListingContent)
        .get((req, res) => {
            renderForm(req, res, FORM_STATES.NOT_SUBMITTED);
        })
        .post(validators, purify, (req, res) => {
            const errors = validationResult(req);

            if (errors.isEmpty()) {
                const details = req.body;
                const items = req.session[materialsOrderKey];
                const orderText = makeOrderText(items, details);

                storeOrderSummary({
                    orderItems: items,
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
                            // Clear order details if success
                            delete req.session[materialsOrderKey];
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
