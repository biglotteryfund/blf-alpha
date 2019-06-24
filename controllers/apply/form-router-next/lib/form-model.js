'use strict';
const cloneDeep = require('lodash/cloneDeep');
const find = require('lodash/find');
const findIndex = require('lodash/findIndex');
const findLastIndex = require('lodash/findLastIndex');
const flatMap = require('lodash/flatMap');
const get = require('lodash/get');
const isEmpty = require('lodash/isEmpty');
const pick = require('lodash/pick');
const reduce = require('lodash/reduce');
const reject = require('lodash/reject');

const Joi = require('@hapi/joi');

const { formatterFor } = require('./formatters');
const normaliseErrors = require('./normalise-errors');

class FormModel {
    constructor(props, data = {}) {
        this.title = props.title;
        this.isBilingual = props.isBilingual || false;
        this.allFields = props.allFields;

        const validation = this.validate(data);

        this.validation = validation;
        this.featuredErrorsAllowList = props.featuredErrorsAllowList || [];

        function enrichField(field) {
            // Assign value to field if present
            const fieldValue = find(data, (value, name) => name === field.name);
            if (fieldValue) {
                field.value = fieldValue;
                field.displayValue = formatterFor(field)(fieldValue);
            }

            // Assign errors to field if present
            field.errors = validation.messages.filter(
                message => message.param === field.name
            );

            return field;
        }

        function enrichStep(section, step, stepIndex) {
            /**
             * Enrich fieldset and filter out any fieldsets with no fields
             * i.e. to account for cases where a fieldset is conditional
             */
            step.fieldsets = reject(
                step.fieldsets.map(fieldset => {
                    fieldset.fields = fieldset.fields.map(enrichField);
                    return fieldset;
                }),
                fieldset => fieldset.fields.length === 0
            );

            /**
             * Flag optional steps if there are no fields
             * i.e. to account for cases where whole step is conditional
             */
            const stepFields = flatMap(step.fieldsets, 'fields');
            step.isRequired = stepFields.length > 0;

            step.slug = `${section.slug}/${stepIndex + 1}`;

            return step;
        }

        this.sections = props.sections.map(originalSection => {
            const section = cloneDeep(originalSection);
            section.steps = section.steps.map(function(step, stepIndex) {
                return enrichStep(section, step, stepIndex);
            });

            function fieldsForSection() {
                const fieldsets = flatMap(section.steps, 'fieldsets');
                return flatMap(fieldsets, 'fields');
            }

            function sectionStatus(validation) {
                const fieldNames = fieldsForSection().map(f => f.name);
                const fieldData = pick(validation.value, fieldNames);
                const fieldErrors = get(validation, 'error.details', []).filter(
                    detail => fieldNames.includes(detail.path[0])
                );

                if (isEmpty(fieldData)) {
                    return 'empty';
                } else if (fieldErrors.length > 0) {
                    return 'incomplete';
                } else {
                    return 'complete';
                }
            }

            section.progress = {
                slug: section.slug,
                label: section.shortTitle || section.title,
                status: sectionStatus(validation)
            };

            return section;
        });

        this.summary = props.summary;
        this.forSalesforce = props.forSalesforce;
    }

    get schema() {
        return Joi.object(
            reduce(
                this.allFields,
                function(acc, field) {
                    acc[field.name] = field.schema;
                    return acc;
                },
                {}
            )
        );
    }

    get messages() {
        return reduce(
            this.allFields,
            function(acc, field) {
                acc[field.name] = field.messages;
                return acc;
            },
            {}
        );
    }

    validate(data) {
        const { value, error } = this.schema.validate(data, {
            abortEarly: false,
            stripUnknown: true
        });

        const normalisedErrors = normaliseErrors({
            validationError: error,
            errorMessages: this.messages,
            formFields: this.allFields
        });

        return {
            value: value,
            error: error,
            isValid: error === null && normalisedErrors.length === 0,
            messages: normalisedErrors
        };
    }

    featuredErrors() {
        if (this.validation.messages.length > 0) {
            return this.validation.messages.filter(message => {
                return this.featuredErrorsAllowList.some(item => {
                    if (item.includeBaseError) {
                        return item.param === message.param;
                    } else {
                        return (
                            item.param === message.param &&
                            message.type !== 'base'
                        );
                    }
                });
            });
        } else {
            return [];
        }
    }

    get progress() {
        return {
            isComplete:
                isEmpty(this.validation.value) === false &&
                this.validation.error === null,
            sections: this.sections.map(section => section.progress)
        };
    }

    getCurrentSteps() {
        return flatMap(this.sections, 'steps');
    }

    getCurrentFields() {
        const fieldsets = flatMap(this.getCurrentSteps(), 'fieldsets');
        return flatMap(fieldsets, 'fields');
    }

    getCurrentFieldsForStep(sectionSlug, stepIndex) {
        const sectionMatch = find(
            this.sections,
            section => section.slug === sectionSlug
        );

        const step = sectionMatch.steps[stepIndex];
        return flatMap(step.fieldsets, 'fields');
    }

    previousSection(sectionSlug) {
        const currentSectionIndex = findIndex(
            this.sections,
            section => section.slug === sectionSlug
        );

        return this.sections[currentSectionIndex - 1];
    }

    nextSection(sectionSlug) {
        const currentSectionIndex = findIndex(
            this.sections,
            section => section.slug === sectionSlug
        );

        return this.sections[currentSectionIndex + 1];
    }

    previousPage({ baseUrl, sectionSlug, currentStepIndex = null }) {
        const currentSection = find(this.sections, s => s.slug === sectionSlug);

        const previousSection = this.previousSection(sectionSlug);

        if (currentStepIndex > 0) {
            const targetIndex = findLastIndex(
                currentSection.steps,
                step => step.isRequired === true,
                currentStepIndex - 1
            );
            return {
                label: currentSection.steps[targetIndex].title,
                url: `${baseUrl}/${currentSection.slug}/${targetIndex + 1}`
            };
        } else if (currentStepIndex === 0 && currentSection.introduction) {
            return {
                label: currentSection.steps[0].title,
                url: `${baseUrl}/${currentSection.slug}`
            };
        } else if (previousSection) {
            const targetIndex = findLastIndex(
                previousSection.steps,
                step => step.isRequired === true
            );
            return {
                label: previousSection.steps[targetIndex].title,
                url: `${baseUrl}/${previousSection.slug}/${targetIndex + 1}`
            };
        } else {
            return {
                // @TODO i18n
                label: 'Dashboard',
                url: baseUrl
            };
        }
    }

    nextPage({ baseUrl, sectionSlug, currentStepIndex = null }) {
        const currentSection = find(
            this.sections,
            section => section.slug === sectionSlug
        );

        const nextSection = this.nextSection(sectionSlug);

        if (currentStepIndex === null && currentSection.introduction) {
            return {
                label: currentSection.steps[0].title,
                url: `${baseUrl}/${currentSection.slug}/1`
            };
        } else {
            const targetIndex = findIndex(
                currentSection.steps,
                step => step.isRequired === true,
                currentStepIndex + 1
            );

            if (
                targetIndex !== -1 &&
                targetIndex <= currentSection.steps.length
            ) {
                return {
                    label: currentSection.steps[targetIndex].title,
                    url: `${baseUrl}/${currentSection.slug}/${targetIndex + 1}`
                };
            } else if (nextSection) {
                return {
                    label: nextSection.steps[0].title,
                    url: `${baseUrl}/${nextSection.slug}`
                };
            } else {
                return {
                    // @TODO i18n
                    label: 'Summary',
                    url: `${baseUrl}/summary`
                };
            }
        }
    }

    pagination(options) {
        return {
            nextPage: this.nextPage(options),
            previousPage: this.previousPage(options)
        };
    }

    fullSummary() {
        return this.getCurrentFields()
            .filter(field => field.displayValue)
            .map(field => {
                return {
                    label: field.label,
                    value: field.displayValue
                };
            });
    }
}

module.exports = { FormModel };
