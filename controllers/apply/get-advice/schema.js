'use strict';
const Joi = require('../lib/joi-extensions');

function singleArrayItem(item) {
    return Joi.array()
        .items(
            Joi.string()
                .only(item)
                .required()
        )
        .required();
}

function numberRange(min, max) {
    return Joi.number()
        .integer()
        .required()
        .min(min)
        .max(max);
}

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
        is: singleArrayItem('scotland'),
        then: numberRange(3, 5),
        otherwise: numberRange(1, 5)
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

module.exports = schema;
