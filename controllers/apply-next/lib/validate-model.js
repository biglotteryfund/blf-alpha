'use strict';
const Joi = require('joi');

module.exports = function validateModel(formModel) {
    const fieldSchema = Joi.object({
        name: Joi.string().required(),
        label: Joi.string().required(),
        explanation: Joi.string().optional(),
        type: Joi.string()
            .valid([
                'address',
                'address-history',
                'budget',
                'checkbox',
                'currency',
                'date',
                'day-month',
                'email',
                'file',
                'number',
                'radio',
                'tel',
                'text',
                'textarea'
            ])
            .required(),
        attributes: Joi.object().optional(),
        isRequired: Joi.alternatives().try(Joi.boolean(), Joi.func()),
        schema: Joi.object()
            .schema()
            .required(),
        messages: Joi.array().items(
            Joi.object({
                type: Joi.string().required(),
                key: Joi.string().optional(),
                message: Joi.string().required()
            })
        )
    });

    const fieldsetSchema = Joi.object({
        legend: Joi.string().required(),
        introduction: Joi.string().optional(),
        fields: Joi.array()
            .items(fieldSchema)
            .required()
    });

    const stepSchema = Joi.object({
        title: Joi.string().required(),
        fieldsets: Joi.array()
            .items(fieldsetSchema)
            .required()
    });

    const sectionSchema = Joi.object({
        slug: Joi.string().required(),
        title: Joi.string().required(),
        shortTitle: Joi.string().optional(),
        introduction: Joi.string().optional(),
        steps: Joi.array()
            .items(stepSchema)
            .required()
    });

    const formSchema = Joi.object({
        id: Joi.string().required(),
        title: Joi.string().required(),
        sections: Joi.array()
            .items(sectionSchema)
            .required()
    });

    const validationResult = Joi.validate(formModel, formSchema, {
        abortEarly: true,
        allowUnknown: true
    });

    if (validationResult.error) {
        throw validationResult.error;
    }
};
