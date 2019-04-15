'use strict';
const Joi = require('joi');

module.exports = function validateModel(formModel) {
    /**
     * Validate fields against a schema
     */
    const localeString = Joi.object({
        en: Joi.string().required(),
        // @TODO: Remove allow '' when translating
        cy: Joi.string()
            .allow('')
            .required()
    });

    const fieldSchema = Joi.object({
        name: Joi.string().required(),
        label: localeString.required(),
        explanation: localeString.optional(),
        type: Joi.string()
            .valid([
                'address',
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
                message: localeString.required()
            })
        )
    });

    const fieldsetSchema = Joi.object({
        legend: localeString.required(),
        introduction: localeString.optional(),
        fields: Joi.array()
            .items(fieldSchema)
            .required()
    });

    const stepSchema = Joi.object({
        title: localeString.required(),
        fieldsets: Joi.array()
            .items(fieldsetSchema)
            .required()
    });

    const sectionSchema = Joi.object({
        slug: Joi.string().required(),
        title: localeString.required(),
        introduction: localeString.optional(),
        steps: Joi.array()
            .items(stepSchema)
            .required()
    });

    const formSchema = Joi.object({
        id: Joi.string().required(),
        title: localeString.required(),
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
