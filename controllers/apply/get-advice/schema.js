'use strict';
const Joi = require('../lib/joi-extensions');

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
        .single(),
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
        .required()
        .min(10000)
        .required()
});

module.exports = schema;
