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
                .withMessage('Please provide a valid email address'); // @TODO
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
        options: [
            {
                name: 'Under £10,000',
                value: 'under10k'
            },
            {
                name: 'Over £10,000',
                value: 'over10k'
            },
            {
                name: "Don't know",
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
                name: 'Event',
                value: 'event'
            },
            {
                name: 'Project opening',
                value: 'projectOpening'
            },
            {
                name: 'Photo opportunity',
                value: 'photoOpportunity'
            },
            {
                name: 'MP Visit',
                value: 'mpVisit'
            },
            {
                name: 'Grant acknowledgment',
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
