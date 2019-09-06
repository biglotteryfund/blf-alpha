'use strict';
const Joi = require('@hapi/joi');

const schema = Joi.object({
    country: Joi.array()
        .items(
            Joi.string().valid([
                'england',
                'scotland',
                'northern-ireland',
                'wales'
            ])
        )
        .single()
});

module.exports = schema;
