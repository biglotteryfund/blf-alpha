'use strict';

const Joi = require('joi');

// via https://github.com/chriso/validator.js/blob/master/lib/isPostalCode.js#L54
const postcode = Joi.string()
    .regex(/^(gir\s?0aa|[a-z]{1,2}\d[\da-z]?\s?(\d[a-z]{2})?)$/i)
    .description('postcode');

const schema = Joi.object().keys({
    'project-start-date': Joi.date()
        .min('now')
        .required(),
    'project-postcode': postcode.required(),
    'your-idea': Joi.string().required()
});

module.exports = schema;
