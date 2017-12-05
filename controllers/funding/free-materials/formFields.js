'use strict';
const { check } = require('express-validator/check');
const translationBasePath = 'funding.guidance.order-free-materials.formFields.';

const getTranslatedError = (field, req) => {
    return req.i18n.__('global.forms.missingFieldError', field.label);
};

const materialFields = {
    yourName: {
        name: 'yourName',
        type: 'text',
        get label() {
            return translationBasePath + this.name;
        },
        required: true,
        validator: function(field, req) {
            return check(field.name)
                .escape()
                .trim()
                .not()
                .isEmpty()
                .withMessage(getTranslatedError(field, req));
        }
    },
    yourEmail: {
        name: 'yourEmail',
        type: 'email',
        get label() {
            return translationBasePath + this.name;
        },
        required: true,
        validator: function(field, req) {
            return check(field.name)
                .escape()
                .trim()
                .not()
                .isEmpty()
                .withMessage(getTranslatedError(field, req))
                .isEmail()
                .withMessage('Please provide a valid email address'); // @TODO
        }
    },
    yourAddress1: {
        name: 'yourAddress1',
        type: 'text',
        get label() {
            return translationBasePath + this.name;
        },
        required: true,
        validator: function(field, req) {
            return check(field.name)
                .escape()
                .trim()
                .not()
                .isEmpty()
                .withMessage(getTranslatedError(field, req));
        }
    },
    yourAddress2: {
        name: 'yourAddress2',
        type: 'text',
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
        get label() {
            return translationBasePath + this.name;
        },
        required: true,
        validator: function(field, req) {
            return check(field.name)
                .escape()
                .trim()
                .not()
                .isEmpty()
                .withMessage(getTranslatedError(field, req));
        }
    },
    yourCounty: {
        name: 'yourCounty',
        type: 'text',
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
        get label() {
            return translationBasePath + this.name;
        },
        required: true,
        validator: function(field, req) {
            return check(field.name)
                .escape()
                .trim()
                .not()
                .isEmpty()
                .withMessage(getTranslatedError(field, req));
        }
    },
    yourProjectName: {
        name: 'yourProjectName',
        type: 'text',
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
        get label() {
            return translationBasePath + this.name;
        },
        required: true,
        validator: function(field, req) {
            return check(field.name)
                .escape()
                .trim()
                .not()
                .isEmpty()
                .withMessage(getTranslatedError(field, req));
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
        get label() {
            return translationBasePath + this.name;
        },
        required: true,
        validator: function(field, req) {
            return check(field.name)
                .escape()
                .trim()
                .not()
                .isEmpty()
                .withMessage(getTranslatedError(field, req));
        }
    }
};

const getValidators = req => {
    return materialFields.map(field => {
        return field.validator(field, req);
    });
};

module.exports = {
    fields: materialFields,
    getValidators: getValidators
};
