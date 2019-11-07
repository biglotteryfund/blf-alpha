'use strict';
const get = require('lodash/fp/get');
const Joi = require('@hapi/joi16');

const validateSchema = require('../../../common/validate-schema');

function localeKeyFor(prop) {
    return `funding.guidance.order-free-materials.formFields.${prop}`;
}

const fields = {
    yourName: {
        type: 'text',
        name: 'yourName',
        label: localeKeyFor('yourName'),
        emailKey: 'Name',
        required: true
    },
    yourEmail: {
        type: 'email',
        name: 'yourEmail',
        label: localeKeyFor('yourEmail'),
        emailKey: 'Email address',
        required: true
    },
    yourAddress1: {
        type: 'text',
        name: 'yourAddress1',
        label: localeKeyFor('yourAddress1'),
        emailKey: 'Address line 1',
        required: true
    },
    yourAddress2: {
        type: 'text',
        name: 'yourAddress2',
        label: localeKeyFor('yourAddress2'),
        emailKey: 'Address line 2',
        required: false
    },
    yourTown: {
        type: 'text',
        name: 'yourTown',
        label: localeKeyFor('yourAddress2'),
        emailKey: 'Town/city',
        required: true
    },
    yourCounty: {
        type: 'text',
        name: 'yourCounty',
        label: localeKeyFor('yourCounty'),
        emailKey: 'County',
        required: false
    },
    yourCountry: {
        type: 'text',
        name: 'yourCountry',
        label: localeKeyFor('yourCountry'),
        emailKey: 'Country',
        required: true
    },
    yourPostcode: {
        type: 'text',
        name: 'yourPostcode',
        label: localeKeyFor('yourPostcode'),
        emailKey: 'Postcode',
        required: true
    },
    yourProjectName: {
        type: 'text',
        name: 'yourProjectName',
        label: localeKeyFor('yourProjectName'),
        emailKey: 'Project name',
        required: false
    },
    yourGrantAmount: {
        type: 'radio',
        name: 'yourGrantAmount',
        label: localeKeyFor('yourGrantAmount'),
        emailKey: 'Grant amount',
        required: false,
        allowOther: true,
        options: [
            { name: localeKeyFor('grantSizes.under10k'), value: 'under10k' },
            { name: localeKeyFor('grantSizes.over10k'), value: 'over10k' },
            { name: localeKeyFor('grantSizes.dunno'), value: 'dunno' }
        ]
    },
    yourReason: {
        type: 'radio',
        name: 'yourReason',
        label: localeKeyFor('yourReason'),
        emailKey: 'Order reason',
        allowOther: true,
        required: false,
        options: [
            {
                name: localeKeyFor('reasons.event'),
                value: 'event'
            },
            {
                name: localeKeyFor('reasons.projectOpening'),
                value: 'projectOpening'
            },
            {
                name: localeKeyFor('reasons.photoOpportunity'),
                value: 'photoOpportunity'
            },
            {
                name: localeKeyFor('reasons.mpVisit'),
                value: 'mpVisit'
            },
            {
                name: localeKeyFor('reasons.grantAcknowledgment'),
                value: 'grantAcknowledgment'
            }
        ]
    }
};

function validate(data, locale = 'en') {
    const localise = get(locale);

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

    const messages = {
        yourName: [
            {
                type: 'base',
                message: localise({
                    en: `Please provide the 'Name' field`,
                    cy: `Darparwch y maes 'Eich enw'`
                })
            }
        ],
        yourEmail: [
            {
                type: 'base',
                message: localise({
                    en: `Please provide the 'Email address' field`,
                    cy: `Darparwch y maes 'Eich cyfeiriad e-bost'`
                })
            },
            {
                type: 'string.email',
                message: localise({
                    en: `Please provide a valid email address`,
                    cy: `Rhowch gyfeiriad e-bost dilys`
                })
            }
        ],
        yourAddress1: [
            {
                type: 'base',
                message: localise({
                    en: `Please provide the 'Address line 1' field`,
                    cy: `Darparwch y maes 'Eich cyfeiriad llinell 1'`
                })
            }
        ],
        yourAddress2: [],
        yourTown: [
            {
                type: 'base',
                message: localise({
                    en: `Please provide the 'Town/city' field`,
                    cy: `Darparwch y maes 'Eich tref/dinas'`
                })
            }
        ],
        yourCounty: [],
        yourCountry: [
            {
                type: 'base',
                message: localise({
                    en: `Please provide the 'Country' field`,
                    cy: `Darparwch y maes 'Eich gwlad'`
                })
            }
        ],
        yourPostcode: [
            {
                type: 'base',
                message: localise({
                    en: `Please provide the 'Postcode' field`,
                    cy: `Darparwch y maes 'Eich côd post'`
                })
            }
        ],
        yourProjectName: [],
        yourGrantAmount: [],
        yourGrantAmountOther: [],
        yourReason: [],
        yourReasonOther: []
    };

    return validateSchema({ schema, messages }, data);
}

module.exports = {
    fields,
    validate
};
