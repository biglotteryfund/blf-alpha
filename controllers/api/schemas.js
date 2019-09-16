'use strict';

const Joi = require('@hapi/joi');

function validateFeedback(data = {}) {
    const schema = Joi.object({
        description: Joi.string().required(),
        message: Joi.string().required()
    });

    return schema.validate(data, {
        abortEarly: false,
        stripUnknown: true
    });
}

function validateSurvey(data = {}) {
    const schema = Joi.object({
        choice: Joi.string()
            .valid(['yes', 'no'])
            .required(),
        path: Joi.string().required(),
        message: Joi.string().optional()
    });

    return schema.validate(data, {
        abortEarly: false,
        stripUnknown: true
    });
}

module.exports = { validateFeedback, validateSurvey };
