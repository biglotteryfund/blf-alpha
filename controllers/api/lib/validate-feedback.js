'use strict';
const Joi = require('@hapi/joi16');

module.exports = function validateFeedback(data = {}) {
    const schema = Joi.object({
        description: Joi.string().required(),
        message: Joi.string().required()
    });

    return schema.validate(data, {
        abortEarly: false,
        stripUnknown: true
    });
};
