const { check, validationResult } = require('express-validator/check');
const { get, set, some, sumBy, values } = require('lodash');
const { purify } = require('../../modules/validators');
const { sanitizeBody } = require('express-validator/filter');
const flash = require('req-flash');
const moment = require('moment');
const Raven = require('raven');

const { errorTranslator } = require('../../modules/validators');
const { FORM_STATES } = require('../../modules/forms');
const { MATERIAL_SUPPLIER } = require('../../modules/secrets');
const cached = require('../../middleware/cached');
const mail = require('../../modules/mail');
const ordersService = require('../../services/orders');

const materials = require('../../config/content/materials.json');
let availableItems = materials.items.filter(i => !i.disabled);

const materialsOrderKey = 'orderedMaterials';
const translateError = errorTranslator('global.forms');
const translationLabelBase = 'funding.guidance.order-free-materials.formFields.';

function checkClean(fieldName) {
    return check(fieldName).trim();
}

function createField(props) {
    const defaults = {
        label: translationLabelBase + props.name,
        required: false
    };

    return Object.assign({}, defaults, props);
}

const materialFields = {
    yourName: createField({
        name: 'yourName',
        type: 'text',
        emailKey: 'Name',
        required: true,
        validator: function(field) {
            return checkClean(field.name)
                .not()
                .isEmpty()
                .withMessage(translateError('missingFieldError', [field.label]));
        }
    }),
    yourEmail: createField({
        name: 'yourEmail',
        type: 'email',
        emailKey: 'Email address',
        required: true,
        validator: function(field) {
            return checkClean(field.name)
                .not()
                .isEmpty()
                .withMessage(translateError('missingFieldError', [field.label]))
                .isEmail()
                .withMessage(translateError('invalidEmailError'));
        }
    }),
    yourAddress1: createField({
        name: 'yourAddress1',
        type: 'text',
        emailKey: 'Address line 1',
        required: true,
        validator: function(field) {
            return checkClean(field.name)
                .not()
                .isEmpty()
                .withMessage(translateError('missingFieldError', [field.label]));
        }
    }),
    yourAddress2: createField({
        name: 'yourAddress2',
        type: 'text',
        emailKey: 'Address line 2',
        required: false,
        validator: function(field) {
            return checkClean(field.name);
        }
    }),
    yourTown: createField({
        name: 'yourTown',
        type: 'text',
        emailKey: 'Town/city',
        required: true,
        validator: function(field) {
            return checkClean(field.name)
                .not()
                .isEmpty()
                .withMessage(translateError('missingFieldError', [field.label]));
        }
    }),
    yourCounty: createField({
        name: 'yourCounty',
        type: 'text',
        emailKey: 'County',
        required: false,
        validator: function(field) {
            return checkClean(field.name);
        }
    }),
    yourCountry: createField({
        name: 'yourCountry',
        type: 'text',
        emailKey: 'Country',
        required: true,
        validator: function(field) {
            return checkClean(field.name)
                .not()
                .isEmpty()
                .withMessage(translateError('missingFieldError', [field.label]));
        }
    }),
    yourPostcode: createField({
        name: 'yourPostcode',
        type: 'text',
        emailKey: 'Postcode',
        required: true,
        validator: function(field) {
            return checkClean(field.name)
                .not()
                .isEmpty()
                .withMessage(translateError('missingFieldError', [field.label]));
        }
    }),
    yourProjectName: createField({
        name: 'yourProjectName',
        type: 'text',
        emailKey: 'Project name',
        required: false,
        validator: function(field) {
            return checkClean(field.name);
        }
    }),
    yourGrantAmount: createField({
        name: 'yourGrantAmount',
        type: 'radio',
        allowOther: true,
        options: [
            {
                name: translationLabelBase + 'grantSizes.under10k',
                value: 'under10k'
            },
            {
                name: translationLabelBase + 'grantSizes.over10k',
                value: 'over10k'
            },
            {
                name: translationLabelBase + 'grantSizes.dunno',
                value: 'dunno'
            }
        ],
        emailKey: 'Grant amount',
        validator: function(field) {
            return checkClean(field.name);
        }
    }),
    yourReason: createField({
        name: 'yourReason',
        type: 'radio',
        allowOther: true,
        options: [
            {
                name: translationLabelBase + 'reasons.event',
                value: 'event'
            },
            {
                name: translationLabelBase + 'reasons.projectOpening',
                value: 'projectOpening'
            },
            {
                name: translationLabelBase + 'reasons.photoOpportunity',
                value: 'photoOpportunity'
            },
            {
                name: translationLabelBase + 'reasons.mpVisit',
                value: 'mpVisit'
            },
            {
                name: translationLabelBase + 'reasons.grantAcknowledgment',
                value: 'grantAcknowledgment'
            }
        ],
        emailKey: 'Order reason',
        validator: function(field) {
            return checkClean(field.name);
        }
    })
};

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

function storeOrderSummary({ orderItems, orderDetails }) {
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
}

function init({ router, routeConfig }) {
    router.use(flash());

    // handle adding/removing items
    router
        .route(routeConfig.path + '/item/:id')
        .post([sanitizeBody('action').escape(), sanitizeBody('code').escape()], cached.noCache, (req, res) => {
            // update the session with ordered items
            const code = req.body.code;

            modifyItems(req, materialsOrderKey, code);

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
                            quantity: get(req.session, [materialsOrderKey, code, 'quantity'], 0),
                            allOrders: req.session[materialsOrderKey],
                            itemBlocked: get(req.session, [materialsOrderKey, 'itemBlocked'], false)
                        });
                    });
                }
            });
        });

    // combine all validators for each field
    let validators = [];
    for (let key in materialFields) {
        let field = materialFields[key];
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

        for (let key in materialFields) {
            let field = materialFields[key];
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

    function renderForm(req, res, status = FORM_STATES.NOT_SUBMITTED) {
        const lang = req.i18n.__(routeConfig.lang);
        const orders = get(req.session, materialsOrderKey, {});
        const numOrders = sumBy(values(orders), order => {
            return order.quantity;
        });

        res.render(routeConfig.template, {
            csrfToken: req.csrfToken(),
            copy: lang,
            title: lang.title,
            description: 'Order items free of charge to acknowledge your grant',
            materials: availableItems,
            formFields: materialFields,
            orders: orders,
            numOrders: numOrders,
            orderStatus: status
        });
    }

    /**
     * Free Materials Order Form
     */
    router
        .route(routeConfig.path)
        .all(cached.csrfProtection)
        .get((req, res) => {
            renderForm(req, res, FORM_STATES.NOT_SUBMITTED);
        })
        .post(validators, purify, (req, res) => {
            const errors = validationResult(req);

            if (errors.isEmpty()) {
                /**
                 * Allow tests to run without sending email
                 * this is only used in tests, so we confirm the form data was correct
                 */
                if (req.body.skipEmail) {
                    res.send(req.body);
                } else {
                    // some fields are optional so matchedData misses them here
                    const details = req.body;
                    const items = req.session[materialsOrderKey];
                    const dateNow = moment().format('dddd, MMMM Do YYYY, h:mm:ss a');
                    const orderText = makeOrderText(items, details);

                    storeOrderSummary({
                        orderItems: items,
                        orderDetails: details
                    })
                        .then(() => {
                            const customerEmail = mail.generateAndSend([
                                {
                                    name: 'customer',
                                    sendTo: req.body.yourEmail,
                                    subject: 'Thank you for your Big Lottery Fund order',
                                    templateName: 'emails/newMaterialOrder',
                                    templateData: {}
                                }
                            ]);

                            const supplierEmail = mail.send({
                                subject: `Order from Big Lottery Fund website - ${dateNow}`,
                                text: orderText.text,
                                sendTo: MATERIAL_SUPPLIER,
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
                }
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
}

module.exports = {
    init
};
