'use strict';
const Joi = require('@hapi/joi');

module.exports = function validateModel(formModel) {
    const fieldSchema = Joi.object({
        name: Joi.string().required(),
        label: Joi.string().required(),
        labelExisting: Joi.string().optional(),
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
        settings: Joi.object().optional(),
        options: Joi.array().optional(),
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
        ),
        warnings: Joi.array().optional(),
        errors: Joi.array().optional(),
        featuredErrors: Joi.array().optional()
    });

    const fieldsetSchema = Joi.object({
        legend: Joi.string().required(),
        introduction: Joi.string().optional(),
        fields: Joi.array()
            .items(fieldSchema)
            .required(),
        footer: Joi.string().optional()
    });

    const stepSchema = Joi.object({
        title: Joi.string().required(),
        slug: Joi.string().required(),
        isRequired: Joi.boolean().required(),
        fieldsets: Joi.array()
            .items(fieldsetSchema)
            .required(),
        message: Joi.object({
            title: Joi.string().required(),
            body: Joi.string().required()
        }).optional(),
        preFlightCheck: Joi.func().optional(),
        isMultipart: Joi.boolean().optional()
    });

    const sectionSchema = Joi.object({
        slug: Joi.string().required(),
        title: Joi.string().required(),
        shortTitle: Joi.string().optional(),
        summary: Joi.string().required(),
        introduction: Joi.string().optional(),
        steps: Joi.array()
            .items(stepSchema)
            .required(),
        hasFeaturedErrors: Joi.boolean().required(),
        progress: Joi.object({
            slug: Joi.string().required(),
            label: Joi.string().required(),
            status: Joi.string()
                .valid(['complete', 'incomplete', 'empty'])
                .required()
        }).required()
    });

    const formSchema = Joi.object({
        title: Joi.string().required(),
        allFields: Joi.object().required(),
        summary: Joi.object().required(),
        schemaVersion: Joi.string().required(),
        forSalesforce: Joi.func().required(),
        formData: Joi.object().required(),
        validation: Joi.object().required(),
        progress: Joi.object().required(),
        featuredErrorsAllowList: Joi.array().optional(),
        sections: Joi.array()
            .items(sectionSchema)
            .required()
    });

    const validationResult = Joi.validate(formModel, formSchema);

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
