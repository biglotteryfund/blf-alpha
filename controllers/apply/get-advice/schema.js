'use strict';
const Joi = require('@hapi/joi');

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
    })
});

module.exports = schema;
