'use strict';
const get = require('lodash/fp/get');
const Joi = require('../lib/joi-extensions');

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
                    en: 'Enter a UK telephone number',
                    cy: 'Rhowch rif ffôn Prydeinig'
                })
            }
        ]
    };

    return {
        schema,
        messages,
        validate(data) {
            return schema.validate(data, { abortEarly: false });
        }
    };
};
