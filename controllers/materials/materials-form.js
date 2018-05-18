'use strict';
const { check } = require('express-validator/check');

const { createStep } = require('../helpers/create-form-model');
const { errorTranslator } = require('../../modules/validators');

const translateError = errorTranslator('global.forms');
const translatable = key => `funding.guidance.order-free-materials.formFields.${key}`;

// @TODO: Move to create-form-model?
function createField(props) {
    const defaults = {
        label: translatable(props.name),
        isTranslatable: true,
        isRequired: false
    };
    return { ...defaults, ...props };
}

// @TODO: move to create-form-model?
function conditionalCheck(field, errorMessage) {
    return function(val, { req }) {
        const conditionalField = req.body[field.conditionalOn.name];
        if (conditionalField === field.conditionalOn.value && val.length < 1) {
            throw new Error(errorMessage);
        } else if (conditionalField !== field.conditionalOn.value) {
            // Clear conditional field
            delete req.body[field.name];
        }

        return true;
    };
}

const formStep = createStep({
    name: 'Your order',
    fieldsets: [
        {
            legend: 'Your details',
            fields: [
                createField({
                    name: 'yourName',
                    type: 'text',
                    emailKey: 'Name',
                    isRequired: true,
                    validator: function(field) {
                        return check(field.name)
                            .trim()
                            .not()
                            .isEmpty()
                            .withMessage(translateError('missingFieldError', [field.label]));
                    }
                }),
                createField({
                    name: 'yourEmail',
                    type: 'email',
                    emailKey: 'Email address',
                    isRequired: true,
                    validator: function(field) {
                        return check(field.name)
                            .trim()
                            .not()
                            .isEmpty()
                            .isEmail()
                            .withMessage(translateError('missingFieldError', [field.label]));
                    }
                })
            ]
        },
        {
            legend: 'Your address',
            fields: [
                createField({
                    name: 'yourAddress1',
                    type: 'text',
                    emailKey: 'Address line 1',
                    isRequired: true,
                    validator: function(field) {
                        return check(field.name)
                            .trim()
                            .not()
                            .isEmpty()
                            .withMessage(translateError('missingFieldError', [field.label]));
                    }
                }),
                createField({
                    name: 'yourAddress2',
                    type: 'text',
                    emailKey: 'Address line 2',
                    isRequired: false,
                    validator: function(field) {
                        return check(field.name).trim();
                    }
                }),
                createField({
                    name: 'yourTown',
                    type: 'text',
                    emailKey: 'Town/city',
                    isRequired: true,
                    validator: function(field) {
                        return check(field.name)
                            .trim()
                            .not()
                            .isEmpty()
                            .withMessage(translateError('missingFieldError', [field.label]));
                    }
                }),
                createField({
                    name: 'yourCounty',
                    type: 'text',
                    emailKey: 'County',
                    isRequired: false,
                    validator: function(field) {
                        return check(field.name).trim();
                    }
                }),
                createField({
                    name: 'yourCountry',
                    type: 'text',
                    emailKey: 'Country',
                    isRequired: true,
                    validator: function(field) {
                        return check(field.name)
                            .trim()
                            .not()
                            .isEmpty()
                            .withMessage(translateError('missingFieldError', [field.label]));
                    }
                }),
                createField({
                    name: 'yourPostcode',
                    type: 'text',
                    emailKey: 'Postcode',
                    isRequired: true,
                    validator: function(field) {
                        return check(field.name)
                            .trim()
                            .not()
                            .isEmpty()
                            .withMessage(translateError('missingFieldError', [field.label]));
                    }
                })
            ]
        },
        {
            legend: 'About your project',
            fields: [
                createField({
                    name: 'yourProjectName',
                    type: 'text',
                    emailKey: 'Project name',
                    isRequired: false,
                    validator: function(field) {
                        return check(field.name).trim();
                    }
                }),
                createField({
                    name: 'yourGrantAmount',
                    type: 'radio',
                    options: [
                        {
                            label: translatable('grantSizes.under10k'),
                            value: 'under10k'
                        },
                        {
                            label: translatable('grantSizes.over10k'),
                            value: 'over10k'
                        },
                        {
                            label: translatable('grantSizes.dunno'),
                            value: 'dunno'
                        },
                        {
                            label: 'global.forms.other',
                            value: 'other'
                        }
                    ],
                    emailKey: 'Grant amount',
                    validator: function(field) {
                        return check(field.name).trim();
                    }
                }),
                createField({
                    name: 'yourGrantAmountOther',
                    label: 'global.forms.other',
                    type: 'text',
                    emailKey: 'Grant amount (other)',
                    conditionalOn: {
                        name: 'yourGrantAmount',
                        value: 'other'
                    },
                    validator: function(field) {
                        return check(field.name).custom(conditionalCheck(field, 'Please provide an answer'));
                    }
                }),
                createField({
                    name: 'yourReason',
                    type: 'radio',
                    allowOther: true,
                    options: [
                        {
                            label: translatable('reasons.event'),
                            value: 'event'
                        },
                        {
                            label: translatable('reasons.projectOpening'),
                            value: 'projectOpening'
                        },
                        {
                            label: translatable('reasons.photoOpportunity'),
                            value: 'photoOpportunity'
                        },
                        {
                            label: translatable('reasons.mpVisit'),
                            value: 'mpVisit'
                        },
                        {
                            label: translatable('reasons.grantAcknowledgment'),
                            value: 'grantAcknowledgment'
                        },
                        {
                            label: 'global.forms.other',
                            value: 'other'
                        }
                    ],
                    emailKey: 'Order reason',
                    validator: function(field) {
                        return check(field.name).trim();
                    }
                }),
                createField({
                    name: 'yourReasonOther',
                    label: 'global.forms.other',
                    type: 'text',
                    emailKey: 'Order reason (other)',
                    conditionalOn: {
                        name: 'yourReason',
                        value: 'other'
                    },
                    validator: function(field) {
                        return check(field.name).custom(conditionalCheck(field, 'Please provide an answer'));
                    }
                })
            ]
        }
    ]
});

module.exports = formStep;
