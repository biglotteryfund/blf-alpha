'use strict';
const Joi = require('@hapi/joi');

module.exports = function validateModel(formModel) {
    const fieldSchema = Joi.object({
        name: Joi.string().required(),
        label: Joi.string().required(),
        explanation: Joi.string().optional(),
        type: Joi.string()
            .valid([
                'address-history',
                'address',
                'budget',
                'checkbox',
                'currency',
                'date',
                'date-range',
                'day-month',
                'email',
                'file',
                'full-name',
                'month-year',
                'number',
                'radio',
                'select',
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
        summary: Joi.string().required(),
        introduction: Joi.string().optional(),
        steps: Joi.array()
            .items(stepSchema)
            .required()
    });

    const formSchema = Joi.object({
        title: Joi.string().required(),
        summary: Joi.object().required(),
        forSalesforce: Joi.func().required(),
        sections: Joi.array()
            .items(sectionSchema)
            .required()
    });

    const validationResult = Joi.validate(formModel, formSchema, {
        abortEarly: true,
        allowUnknown: true
    });

    const arrayFieldTypes = [
        'budget',
        'checkbox',
        'date',
        'date-range',
        'day-month'
    ];

    // Check that we haven't used a multipart field on a step with array values
    // because we use a custom body parser (Formidable) which doesn't handle these
    // in the same way as body-parser (eg. using qs library). Throws an error if
    // we attempt to add an array field to one of these steps.
    formModel.sections = formModel.sections.map(section => {
        section.steps = section.steps.map(step => {
            if (step.isMultipart) {
                step.fieldsets.some(fieldset => {
                    fieldset.fields.some(field => {
                        if (arrayFieldTypes.indexOf(field.type) !== -1) {
                            throw new Error(
                                `Error: An array field "${field.name}" was added to this multipart step "${step.title}", which will fail.`
                            );
                        }
                    });
                });
            }
        });
    });

    if (validationResult.error) {
        throw validationResult.error;
    }
};
