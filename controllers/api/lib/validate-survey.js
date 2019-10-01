'use strict';
const Joi = require('@hapi/joi16');

module.exports = function validateSurvey(data = {}) {
    const schema = Joi.object({
        choice: Joi.string()
            .valid('yes', 'no')
            .required(),
        path: Joi.string().required(),
        message: Joi.string().optional()
    });

    return schema.validate(data, {
        abortEarly: false,
        stripUnknown: true
    });
};
