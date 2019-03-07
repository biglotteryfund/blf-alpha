'use strict';
const { check } = require('express-validator/check');

const FUND_SIZE = {
    min: 30000,
    max: 100000
};

// Allows us to share postcode validation on server and client-side
// via https://github.com/chriso/validator.js/blob/master/lib/isPostalCode.js#L54
// we have to double-escape the regex patterns here to output it as a native RegExp
// but also as a string for the HTML pattern attribute
const POSTCODE_PATTERN = '(gir\\s?0aa|[a-zA-Z]{1,2}\\d[\\da-zA-Z]?\\s?(\\d[a-zA-Z]{2})?)';
const POSTCODE_REGEX = new RegExp(POSTCODE_PATTERN, 'i');
const isValidPostcode = input => POSTCODE_REGEX.test(input);

const currentWork = [
    {
        fields: [
            {
                name: 'current-work',
                type: 'textarea',
                attributes: { rows: 12 },
                isRequired: true
            }
        ]
    }
];

const yourIdea = [
    {
        legend: 'Your idea',
        fields: [
            {
                name: 'project-name',
                type: 'text',
                size: 180,
                isRequired: true
            },
            {
                name: 'project-idea',
                type: 'textarea',
                attributes: { rows: 12 },
                isRequired: true
            },
            {
                name: 'project-impact',
                type: 'textarea',
                attributes: { rows: 12 },
                isRequired: true
            }
        ]
    }
];

const projectActivities = [
    {
        fields: [
            {
                name: 'project-activities-a',
                type: 'textarea',
                attributes: { rows: 12 },
                isRequired: true
            },
            {
                name: 'project-activities-b',
                type: 'textarea',
                attributes: { rows: 12 }
            },
            {
                name: 'project-activities-c',
                type: 'textarea',
                attributes: { rows: 12 }
            }
        ]
    }
];

const socialConnections = [
    {
        fields: [
            {
                name: 'social-connections',
                type: 'textarea',
                attributes: { rows: 12 },
                isRequired: true
            }
        ]
    }
];

const projectEvaluation = [
    {
        fields: [
            {
                name: 'project-evaluation',
                type: 'textarea',
                attributes: { rows: 12 },
                lengthHint: 'A couple of paragraphs.'
            }
        ]
    }
];

const projectLocation = [
    {
        fields: [
            {
                name: 'location',
                type: 'checkbox',
                options: [
                    { value: 'North East' },
                    { value: 'North West' },
                    { value: 'Yorkshire and the Humber' },
                    { value: 'East Midlands' },
                    { value: 'West Midlands' },
                    { value: 'East of England' },
                    { value: 'Greater London' },
                    { value: 'South East' },
                    { value: 'South West' }
                ],
                isRequired: true
            },
            {
                name: 'project-location',
                type: 'text',
                size: 60,
                isRequired: true
            }
        ]
    }
];

const projectBudget = [
    {
        fields: [
            {
                name: 'project-budget-total',
                type: 'currency',
                min: FUND_SIZE.min,
                max: FUND_SIZE.max,
                size: 20,
                isRequired: true
            }
        ]
    },
    {
        fields: [
            {
                name: 'project-budget-a-amount',
                type: 'number',
                min: 0,
                max: FUND_SIZE.max,
                isCurrency: true,
                size: 20,
                isRequired: true
            },
            {
                name: 'project-budget-a-description',
                type: 'textarea',
                attributes: { rows: 12 },
                isRequired: true
            },
            {
                name: 'project-budget-b-amount',
                type: 'number',
                min: 0,
                max: FUND_SIZE.max,
                isCurrency: true,
                silentlyOptional: true,
                size: 20
            },
            {
                name: 'project-budget-b-description',
                type: 'textarea',
                attributes: { rows: 12 },
                silentlyOptional: true
            },
            {
                name: 'project-budget-c-amount',
                type: 'number',
                min: 0,
                max: FUND_SIZE.max,
                isCurrency: true,
                silentlyOptional: true,
                size: 20
            },
            {
                name: 'project-budget-c-description',
                type: 'textarea',
                attributes: { rows: 12 },
                silentlyOptional: true
            }
        ]
    }
];

const organisationDetails = [
    {
        fields: [
            {
                type: 'text',
                name: 'organisation-name',
                isRequired: true
            }
        ]
    },
    {
        fields: [
            {
                type: 'text',
                name: 'address-building-street',
                isRequired: true,
                size: 50
            },
            {
                type: 'text',
                name: 'address-town-city',
                isRequired: true,
                size: 25
            },
            {
                type: 'text',
                name: 'address-county',
                isRequired: true,
                size: 25
            },
            {
                type: 'text',
                name: 'address-postcode',
                size: 10,
                isRequired: true,
                attributes: {
                    pattern: POSTCODE_PATTERN
                },
                validator(field) {
                    return check(field.name)
                        .trim()
                        .not()
                        .isEmpty()
                        .withMessage('Postcode must be provided')
                        .custom(value => isValidPostcode(value))
                        .withMessage('Please provide a valid UK postcode');
                }
            }
        ]
    },
    {
        fields: [
            {
                type: 'text',
                name: 'organisation-charity-number'
            },
            {
                type: 'text',
                name: 'organisation-company-number'
            }
        ]
    }
];

const mainContact = [
    {
        fields: [
            {
                type: 'text',
                name: 'first-name',
                autocompleteName: 'given-name',
                isRequired: true
            },
            {
                type: 'text',
                name: 'last-name',
                autocompleteName: 'family-name',
                isRequired: true
            },
            {
                type: 'email',
                name: 'email',
                autocompleteName: 'email',
                isRequired: true,
                validator: function(field) {
                    return check(field.name)
                        .trim()
                        .isEmail()
                        .withMessage('Please provide a valid email address');
                }
            },
            {
                type: 'text',
                name: 'phone-number',
                isRequired: true,
                autocompleteName: 'tel'
            }
        ]
    }
];

module.exports = {
    currentWork,
    mainContact,
    organisationDetails,
    projectActivities,
    projectBudget,
    projectEvaluation,
    projectLocation,
    socialConnections,
    yourIdea,
    isValidPostcode
};
