'use strict';
const { check } = require('express-validator/check');
const Joi = require('@hapi/joi');

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
const translationLabelBase =
    'funding.guidance.order-free-materials.formFields.';

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

const fields = {
    yourName: createField({
        name: 'yourName',
        type: 'text',
        emailKey: 'Name',
        required: true,
        validator: function(field) {
            return checkClean(field.name)
                .not()
                .isEmpty()
                .withMessage(
                    translateError('missingFieldError', [field.label])
                );
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
                .withMessage(
                    translateError('missingFieldError', [field.label])
                );
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
                .withMessage(
                    translateError('missingFieldError', [field.label])
                );
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
                .withMessage(
                    translateError('missingFieldError', [field.label])
                );
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
                .withMessage(
                    translateError('missingFieldError', [field.label])
                );
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

function validateSchema(data) {
    const schema = Joi.object({
        yourName: Joi.string().required(),
        yourEmail: Joi.string()
            .email()
            .required(),
        yourAddress1: Joi.string().required(),
        yourAddress2: Joi.string()
            .allow('')
            .optional(),
        yourTown: Joi.string().required(),
        yourCounty: Joi.string()
            .allow('')
            .optional(),
        yourCountry: Joi.string().required(),
        yourPostcode: Joi.string().required(),
        yourProjectName: Joi.string()
            .allow('')
            .optional(),
        yourGrantAmount: Joi.string()
            .allow('')
            .optional(),
        yourGrantAmountOther: Joi.string()
            .allow('')
            .optional(),
        yourReason: Joi.string()
            .allow('')
            .optional(),
        yourReasonOther: Joi.string()
            .allow('')
            .optional()
    });

    return schema.validate(data, {
        abortEarly: false,
        stripUnknown: true
    });
}

module.exports = {
    fields,
    validateSchema
};
