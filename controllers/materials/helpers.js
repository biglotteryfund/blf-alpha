'use strict';
const { reduce } = require('lodash');
const { check } = require('express-validator/check');

function errorTranslator(prefix) {
    return function(prop, replacementKeys = []) {
        return function(value, { req }) {
            const t = `${prefix}.${prop}`;
            const replacements = replacementKeys.map(_ => req.i18n.__(_));
            return replacements.length > 0
                ? req.i18n.__(t, replacements)
                : req.i18n.__(t);
        };
    };
}

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

function normaliseUserInput(userInput) {
    return reduce(
        materialFields,
        (acc, field) => {
            let fieldLabel = field.emailKey;
            const originalFieldValue = userInput[field.name];
            const otherValue = userInput[field.name + 'Other'];

            // Override value if "other" field is entered.
            const fieldValue = field.allowOther && otherValue ? otherValue : originalFieldValue;

            if (fieldValue) {
                acc.push({
                    key: field.name,
                    label: fieldLabel,
                    value: fieldValue
                });
            }

            return acc;
        },
        []
    );
}

/**
 * Create text for order email
 */
function makeOrderText(items, details) {
    const orderSummary = reduce(
        items,
        (acc, item) => {
            if (item.quantity > 0) {
                acc.push(`\t- x${item.quantity} ${item.code} (item: ${item.name})`);
            }
            return acc;
        },
        []
    );

    // parse their details (eg. merge "other" responses into their parent fields)
    // then build it into a string for the order email
    const customerDetails = normaliseUserInput(details).map(d => `\t${d.label}: ${d.value}`);

    const text = `
A new order has been received from The National Lottery Community Fund website. The order details are below:

${orderSummary.join('\n')}

The customer's personal details are below:

${customerDetails.join('\n')}

This email has been automatically generated from The National Lottery Community Fund website.
If you have feedback, please contact digital.monitoring@tnlcommunityfund.org.uk.`;

    return text.trim();
}

module.exports = {
    materialFields,
    makeOrderText,
    normaliseUserInput
};
