'use strict';
const get = require('lodash/fp/get');
const reduce = require('lodash/reduce');
const { oneLine } = require('common-tags');

const Joi = require('../lib/joi-extensions');
const normaliseErrors = require('../lib/normalise-errors');

module.exports = function({ locale = 'en' } = {}) {
    const localise = get(locale);

    const allFields = {
        projectCountry: {
            schema: Joi.array()
                .items(
                    Joi.string().valid([
                        'england',
                        'scotland',
                        'northern-ireland',
                        'wales'
                    ])
                )
                .single()
                .required()
        },
        projectLocation: {
            schema: Joi.when('projectCountry', {
                is: Joi.array().min(2),
                then: Joi.any().strip(),
                otherwise: Joi.string().required()
            })
        },
        projectLocationDescription: {
            schema: Joi.string()
                .allow('')
                .optional()
        },
        projectCosts: {
            schema: Joi.friendlyNumber()
                .integer()
                .min(10000)
                .required()
        },
        projectDurationYears: {
            schema: Joi.when('projectCountry', {
                is: Joi.array().min(2),
                then: Joi.any().strip()
            }).when('projectCountry', {
                is: Joi.array()
                    .items(
                        Joi.string()
                            .only('scotland')
                            .required()
                    )
                    .required(),
                then: Joi.number()
                    .integer()
                    .required()
                    .min(3)
                    .max(5),
                otherwise: Joi.number()
                    .integer()
                    .required()
                    .min(1)
                    .max(5)
            })
        },
        projectIdea: {
            schema: Joi.string()
                .minWords(50)
                .maxWords(500)
                .required()
        },
        organisationLegalName: {
            schema: Joi.string().required()
        },
        organisationTradingName: {
            schema: Joi.string()
                .allow('')
                .optional()
        },
        organisationAddress: {
            schema: Joi.ukAddress().required()
        },
        organisationType: {
            schema: Joi.string().required()
        },
        organisationBackground: {
            schema: Joi.string()
                .minWords(50)
                .maxWords(500)
                .required()
        },
        contactName: {
            schema: Joi.fullName().required()
        },
        contactEmail: {
            schema: Joi.string()
                .email()
                .required()
        },
        contactPhone: {
            schema: Joi.string()
                .phoneNumber()
                .allow('')
                .optional()
        }
    };

    const messages = {
        projectCountry: [
            {
                type: 'base',
                message: localise({
                    en: 'Select a country',
                    cy: 'Dewiswch wlad'
                })
            }
        ],
        projectLocation: [
            {
                type: 'base',
                message: localise({
                    en: 'Select a location',
                    cy: 'Dewiswch leoliad'
                })
            }
        ],
        projectLocationDescription: [],
        projectCosts: [
            {
                type: 'base',
                message: localise({
                    en: 'Enter a total cost for your project',
                    cy: 'Rhowch gyfanswm cost eich prosiect'
                })
            },
            {
                type: 'number.integer',
                message: localise({
                    en: `Total cost must be a whole number (eg. no decimal point)`,
                    cy: `Rhaid i’r cost fod yn rif cyflawn (e.e. dim pwynt degol)`
                })
            },
            {
                type: 'number.min',
                message: localise({
                    en: `Must be at least £10,000`,
                    cy: ``
                })
            }
        ],
        projectDurationYears: [
            {
                type: 'base',
                message: localise({
                    en: 'Select a project duration',
                    cy: ''
                })
            }
        ],
        projectIdea: [
            {
                type: 'base',
                message: localise({
                    en: `Tell us about your idea`,
                    cy: ``
                })
            },
            {
                type: 'string.minWords',
                message: localise({
                    en: `Answer must be at least 50 words`,
                    cy: `Rhaid i’r ateb fod yn o leiaf 50 gair`
                })
            },
            {
                type: 'string.maxWords',
                message: localise({
                    en: `Answer must be no more than 500 words`,
                    cy: `Rhaid i’r ateb fod yn llai na 500 gair`
                })
            }
        ],
        organisationLegalName: [
            {
                type: 'base',
                message: localise({
                    en: 'Enter the full legal name of the organisation',
                    cy: 'Rhowch enw cyfreithiol llawn eich sefydliad'
                })
            }
        ],
        organisationTradingName: [],
        organisationAddress: [
            {
                type: 'base',
                message: localise({
                    en: 'Enter a full UK address',
                    cy: 'Rhowch gyfeiriad Prydeinig llawn'
                })
            },
            {
                type: 'any.empty',
                key: 'line1',
                message: localise({
                    en: 'Enter a building and street',
                    cy: 'Rhowch adeilad a stryd'
                })
            },
            {
                type: 'any.empty',
                key: 'townCity',
                message: localise({
                    en: 'Enter a town or city',
                    cy: 'Rhowch dref neu ddinas'
                })
            },
            {
                type: 'any.empty',
                key: 'postcode',
                message: localise({
                    en: 'Enter a postcode',
                    cy: 'Rhowch gôd post'
                })
            },
            {
                type: 'string.postcode',
                key: 'postcode',
                message: localise({
                    en: 'Enter a real postcode',
                    cy: 'Rhowch gôd post go iawn'
                })
            }
        ],
        organisationType: [],
        organisationBackground: [
            {
                type: 'base',
                message: localise({
                    en: `Tell us about your organisation`,
                    cy: ``
                })
            },
            {
                type: 'string.minWords',
                message: localise({
                    en: `Answer must be at least 50 words`,
                    cy: `Rhaid i’r ateb fod yn o leiaf 50 gair`
                })
            },
            {
                type: 'string.maxWords',
                message: localise({
                    en: `Answer must be no more than 500 words`,
                    cy: `Rhaid i’r ateb fod yn llai na 500 gair`
                })
            }
        ],
        contactName: [
            {
                type: 'base',
                message: localise({
                    en: 'Enter first and last name',
                    cy: 'Rhowch enw cyntaf a chyfenw'
                })
            },
            {
                type: 'any.empty',
                key: 'firstName',
                message: localise({
                    en: 'Enter first name',
                    cy: 'Rhowch enw cyntaf'
                })
            },
            {
                type: 'any.empty',
                key: 'lastName',
                message: localise({
                    en: 'Enter last name',
                    cy: 'Rhowch gyfenw'
                })
            }
        ],
        contactEmail: [
            {
                type: 'base',
                message: localise({
                    en: 'Enter an email address',
                    cy: 'Rhowch gyfeiriad e-bost'
                })
            },
            {
                type: 'string.email',
                message: localise({
                    en: oneLine`Email address must be in the correct format,
                        like name@example.com`,
                    cy: oneLine`Rhaid i’r cyfeiriad e-bost for yn y ffurf cywir,,
                        e.e enw@example.com`
                })
            }
        ],
        contactPhone: [
            {
                type: 'base',
                message: localise({
                    en: 'Enter a UK telephone number',
                    cy: 'Rhowch rif ffôn Prydeinig'
                })
            },
            {
                type: 'string.phonenumber',
                message: localise({
                    en: 'Enter a real UK telephone number',
                    cy: 'Rhowch rif ffôn Prydeinig go iawn'
                })
            }
        ]
    };

    const schema = Joi.object(
        reduce(
            allFields,
            function(acc, field, name) {
                acc[name] = field.schema;
                return acc;
            },
            {}
        )
    );

    return {
        schema,
        messages,
        validate(data) {
            const validationResult = schema.validate(data, {
                abortEarly: false,
                stripUnknown: true
            });

            const messages = normaliseErrors({
                validationError: validationResult.error,
                errorMessages: this.messages,
                formFields: this.allFields
            });

            return {
                value: validationResult.value,
                error: validationResult.error,
                isValid:
                    validationResult.error === null && messages.length === 0,
                messages: messages
            };
        }
    };
};
