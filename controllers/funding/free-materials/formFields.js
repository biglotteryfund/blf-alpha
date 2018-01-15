'use strict';
const { check } = require('express-validator/check');
const translationBasePath = 'funding.guidance.order-free-materials.formFields.';

const getTranslatedError = field => {
    return {
        translateable: true,
        errorPath: 'global.forms.missingFieldError',
        paramPath: field.label
    };
};

const materialFields = {
    yourName: {
        name: 'yourName',
        type: 'text',
        emailKey: 'Name',
        get label() {
            return translationBasePath + this.name;
        },
        required: true,
        validator: function(field) {
            return check(field.name)
                .escape()
                .trim()
                .not()
                .isEmpty()
                .withMessage(getTranslatedError(field));
        }
    },
    yourEmail: {
        name: 'yourEmail',
        type: 'email',
        emailKey: 'Email address',
        get label() {
            return translationBasePath + this.name;
        },
        required: true,
        validator: function(field) {
            return check(field.name)
                .escape()
                .trim()
                .not()
                .isEmpty()
                .withMessage(getTranslatedError(field))
                .isEmail()
                .withMessage({
                    translateable: true,
                    errorPath: 'global.forms.invalidEmailError'
                });
        }
    },
    yourAddress1: {
        name: 'yourAddress1',
        type: 'text',
        emailKey: 'Address line 1',
        get label() {
            return translationBasePath + this.name;
        },
        required: true,
        validator: function(field) {
            return check(field.name)
                .escape()
                .trim()
                .not()
                .isEmpty()
                .withMessage(getTranslatedError(field));
        }
    },
    yourAddress2: {
        name: 'yourAddress2',
        type: 'text',
        emailKey: 'Address line 2',
        get label() {
            return translationBasePath + this.name;
        },
        required: false,
        validator: function(field) {
            return check(field.name)
                .escape()
                .trim();
        }
    },
    yourTown: {
        name: 'yourTown',
        type: 'text',
        emailKey: 'Town/city',
        get label() {
            return translationBasePath + this.name;
        },
        required: true,
        validator: function(field) {
            return check(field.name)
                .escape()
                .trim()
                .not()
                .isEmpty()
                .withMessage(getTranslatedError(field));
        }
    },
    yourCounty: {
        name: 'yourCounty',
        type: 'text',
        emailKey: 'County',
        get label() {
            return translationBasePath + this.name;
        },
        required: false,
        validator: function(field) {
            return check(field.name)
                .escape()
                .trim();
        }
    },
    yourCountry: {
        name: 'yourCountry',
        type: 'text',
        emailKey: 'Country',
        get label() {
            return translationBasePath + this.name;
        },
        required: true,
        validator: function(field) {
            return check(field.name)
                .escape()
                .trim()
                .not()
                .isEmpty()
                .withMessage(getTranslatedError(field));
        }
    },
    yourPostcode: {
        name: 'yourPostcode',
        type: 'text',
        emailKey: 'Postcode',
        get label() {
            return translationBasePath + this.name;
        },
        required: true,
        validator: function(field) {
            return check(field.name)
                .escape()
                .trim()
                .not()
                .isEmpty()
                .withMessage(getTranslatedError(field));
        }
    },
    yourProjectName: {
        name: 'yourProjectName',
        type: 'text',
        emailKey: 'Project name',
        get label() {
            return translationBasePath + this.name;
        },
        required: false,
        validator: function(field) {
            return check(field.name)
                .escape()
                .trim();
        }
    },
    yourGrantAmount: {
        name: 'yourGrantAmount',
        type: 'radio',
        allowOther: true,
        options: [
            {
                name: translationBasePath + 'grantSizes.under10k',
                value: 'under10k'
            },
            {
                name: translationBasePath + 'grantSizes.over10k',
                value: 'over10k'
            },
            {
                name: translationBasePath + 'grantSizes.dunno',
                value: 'dunno'
            }
        ],
        emailKey: 'Grant amount',
        get label() {
            return translationBasePath + this.name;
        },
        required: true,
        validator: function(field) {
            return check(field.name)
                .escape()
                .trim()
                .not()
                .isEmpty()
                .withMessage(getTranslatedError(field));
        }
    },
    yourReason: {
        name: 'yourReason',
        type: 'radio',
        allowOther: true,
        options: [
            {
                name: translationBasePath + 'reasons.event',
                value: 'event'
            },
            {
                name: translationBasePath + 'reasons.projectOpening',
                value: 'projectOpening'
            },
            {
                name: translationBasePath + 'reasons.photoOpportunity',
                value: 'photoOpportunity'
            },
            {
                name: translationBasePath + 'reasons.mpVisit',
                value: 'mpVisit'
            },
            {
                name: translationBasePath + 'reasons.grantAcknowledgment',
                value: 'grantAcknowledgment'
            }
        ],
        emailKey: 'Order reason',
        get label() {
            return translationBasePath + this.name;
        },
        required: true,
        validator: function(field) {
            return check(field.name)
                .escape()
                .trim()
                .not()
                .isEmpty()
                .withMessage(getTranslatedError(field));
        }
    }
};

module.exports = {
    fields: materialFields
};
