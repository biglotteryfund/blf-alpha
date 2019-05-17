'use strict';
const Joi = require('../joi-extensions');

function ukAddress() {
    return Joi.object({
        'building-street': Joi.string().required(),
        'town-city': Joi.string().required(),
        'county': Joi.string()
            .allow('')
            .optional(),
        'postcode': Joi.string()
            .postcode()
            .required()
    });
}

module.exports = {
    Joi,
    ukAddress
};
