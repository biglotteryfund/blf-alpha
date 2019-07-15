'use strict';
const cloneDeep = require('lodash/cloneDeep');
const find = require('lodash/find');
const findIndex = require('lodash/findIndex');
const findLastIndex = require('lodash/findLastIndex');
const flatMap = require('lodash/flatMap');
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

        this.featuredErrorsAllowList = props.featuredErrorsAllowList || [];

        const validation = this.validate(data);
        this.validation = validation;

        /**
         * Enrich field
         * Assign current value and errors to field if present
         */
        function enrichField(field) {
            const fieldValue = find(data, (value, name) => name === field.name);
            if (fieldValue) {
                field.value = fieldValue;
                field.displayValue = formatterFor(field)(fieldValue);
            }

            function messageMatchesField(message) {
                return message.param === field.name;
            }

            field.errors = validation.messages.filter(messageMatchesField);
            field.featuredErrors = validation.featuredMessages.filter(
                messageMatchesField
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

            function sectionStatus() {
                const fieldNames = fieldsForSection().map(f => f.name);
                const fieldData = pick(data, fieldNames);
                const fieldErrors = validation.messages.filter(item =>
                    fieldNames.includes(item.param)
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

            function hasFeaturedErrors() {
                const fieldNames = fieldsForSection().map(f => f.name);
                return validation.featuredMessages.some(item =>
                    fieldNames.includes(item.param)
                );
            }

            section.hasFeaturedErrors = hasFeaturedErrors();

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

        const messages = normaliseErrors({
            validationError: error,
            errorMessages: this.messages,
            formFields: this.allFields
        });

        /**
         * Consider messages featured if field names are
         * included in featuredErrorsAllowList and the
         * message type is not the 'base` message.
         */
        const featuredMessages = messages.filter(message => {
            return this.featuredErrorsAllowList.some(name => {
                return name === message.param && message.type !== 'base';
            });
        });

        return {
            value: value,
            error: error,
            isValid: error === null && messages.length === 0,
            messages: messages,
            featuredMessages: featuredMessages
        };
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

    getStep(sectionSlug, stepIndex) {
        const sectionMatch = find(
            this.sections,
            section => section.slug === sectionSlug
        );

        return sectionMatch.steps[stepIndex];
    }

    getCurrentFieldsForStep(sectionSlug, stepIndex) {
        const step = this.getStep(sectionSlug, stepIndex);
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
                label: 'Summary',
                url: `${baseUrl}/summary`
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
