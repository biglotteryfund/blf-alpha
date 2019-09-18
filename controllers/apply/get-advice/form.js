'use strict';
const get = require('lodash/fp/get');

const Joi = require('../lib/joi-extensions');
const normaliseErrors = require('../lib/normalise-errors');

module.exports = function({ locale = 'en' } = {}) {
    const localise = get(locale);

    const schema = Joi.object({
        projectCountry: Joi.array()
            .items(
                Joi.string().valid([
                    'england',
                    'scotland',
                    'northern-ireland',
                    'wales'
                ])
            )
            .single()
            .required(),
        projectLocation: Joi.when('projectCountry', {
            is: Joi.array().min(2),
            then: Joi.any().strip(),
            otherwise: Joi.string().required()
        }),
        projectLocationDescription: Joi.string()
            .allow('')
            .optional(),
        projectCosts: Joi.friendlyNumber()
            .integer()
            .min(10000)
            .required(),
        projectDurationYears: Joi.when('projectCountry', {
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
        }),
        projectIdea: Joi.string()
            .minWords(50)
            .maxWords(500)
            .required(),
        organisationLegalName: Joi.string().required(),
        organisationTradingName: Joi.string()
            .allow('')
            .optional(),
        organisationAddress: Joi.ukAddress().required(),
        organisationType: Joi.string().required(),
        organisationBackground: Joi.string()
            .minWords(50)
            .maxWords(500)
            .required(),
        contactName: Joi.fullName().required(),
        contactEmail: Joi.string()
            .email()
            .required(),
        contactPhone: Joi.string()
            .phoneNumber()
            .allow('')
            .optional()
    });

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
        projectDurationYears: [],
        projectIdea: [],
        organisationLegalName: [],
        organisationTradingName: [],
        organisationAddress: [],
        organisationType: [],
        organisationBackground: [],
        contactName: [],
        contactEmail: [],
        contactPhone: []
    };

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
