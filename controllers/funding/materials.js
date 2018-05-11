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

// const materials = require('../../config/content/materials.json');
const materialsOrderKey = 'orderedMaterials';
// const availableItems = materials.items.filter(i => !i.disabled);

/*
* @TODO
*   POST the product ID, maximum allowed and disallowed items
*   check action is valid
*   check if existing basket contains any disallowed items (and return error if so)
*   check if they're at max capacity for item (and return error if so)
*   otherwise increment/decrement/delete product
 */

function modifyItems(req) {
    const validActions = ['increase', 'decrease', 'remove'];

    const action = req.body.action;
    const productId = parseInt(req.body.productId);
    const materialId = parseInt(req.body.materialId);
    const maxQuantity = parseInt(req.body.max);
    const notAllowedWith = (req.body.notAllowedWith) ? req.body.notAllowedWith.split(',').map(i => parseInt(i)) : false;

    const isValidAction = validActions.indexOf(action) !== -1;
    const allCurrentOrders = get(req.session, [materialsOrderKey], {});

    if (isValidAction) {

        // How many of the current item do they have?
        const currentItemQuantity = get(req.session, [materialsOrderKey, productId, 'quantity'], 0);

        // Check if their current orders contain a blocker
        // note that this only works in one direction:
        // eg. it only checks if the product you're adding has constraints
        // eg. item A is blocked with item B (but you can add item B first, then add A)
        // solution is to make item A block item B and item B block item A in the CMS
        // or track the blocked items here and check both ends.
        const hasBlockerItem = some(allCurrentOrders, order => {
            if (!notAllowedWith) { return; }
            const itemIsBlocked = notAllowedWith.indexOf(order.materialId) !== -1;
            return itemIsBlocked && order.quantity > 0;
        });

        const noSpaceLeft = currentItemQuantity === maxQuantity;

        // Reset the blocker flag
        set(req.session, [materialsOrderKey, 'itemBlocked'], false);

        if (action === 'increase') {
            if (!noSpaceLeft && !hasBlockerItem) {
                set(req.session, [materialsOrderKey, productId, 'id'], productId);
                set(req.session, [materialsOrderKey, productId, 'materialId'], materialId);
                set(req.session, [materialsOrderKey, productId, 'quantity'], currentItemQuantity + 1);
            } else {
                // Alert the user that they're blocked from adding this item
                set(req.session, [materialsOrderKey, 'itemBlocked'], true);
            }
        } else if (currentItemQuantity > 1 && action === 'decrease') {
            set(req.session, [materialsOrderKey, productId, 'id'], productId);
            set(req.session, [materialsOrderKey, productId, 'materialId'], materialId);
            set(req.session, [materialsOrderKey, productId, 'quantity'], currentItemQuantity - 1);
        } else if (action === 'remove' || (action === 'decrease' && currentItemQuantity === 1)) {
            // we do this to preserve a value of 0 on the frontend quantity label
            // if we delete the product, Vue regards it as missing (eg. remains at 1)
            set(req.session, [materialsOrderKey, productId, 'quantity'], 0);
        }
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
                        quantity: getNumOrders(get(req.session, [materialsOrderKey])),
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

async function injectMerchandise(req, res, next) {
    try {
        res.locals.availableItems = await contentApi.getMerchandise(req.i18n.getLocale());
        next();
    } catch(error) {
        next(error);
    }
}

const getNumOrders = orders => sumBy(values(orders), o => o.quantity);

/**
 * Initialise order form
 */
function initForm({ router, routeConfig }) {
    function renderForm(req, res, status = FORM_STATES.NOT_SUBMITTED) {
        const lang = req.i18n.__(routeConfig.lang);
        const availableItems = res.locals.availableItems;
        const orders = get(req.session, materialsOrderKey, {});

        const formActionBase = '/' + res.locals.sectionId + routeConfig.path;

        res.render(routeConfig.template, {
            csrfToken: req.csrfToken(),
            copy: lang,
            title: lang.title,
            description: 'Order items free of charge to acknowledge your grant',
            materials: availableItems,
            formFields: materialFields,
            orders: orders,
            numOrders: getNumOrders(orders),
            orderStatus: status,
            formActionBase: formActionBase
        });
    }

    const validators = map(materialFields, field => field.validator(field));

    router
        .route(routeConfig.path)
        .all(cached.csrfProtection, injectMerchandise)
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
