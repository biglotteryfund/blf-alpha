'use strict';
const { cloneDeep, find, findIndex, flatMap, flatMapDeep, includes, isEmpty, pick } = require('lodash');
const { get, getOr } = require('lodash/fp');
const moment = require('moment');

const FORM_STATES = {
    incomplete: {
        type: 'incomplete',
        label: 'In progress'
    },
    complete: {
        type: 'complete',
        label: 'Complete'
    },
    invalid: {
        type: 'invalid',
        label: 'Invalid'
    },
    empty: {
        type: 'empty',
        label: 'Not started'
    }
};

function prepareForm(locale, formModel, formData) {
    const localise = get(locale);

    const translateSection = section => {
        section.title = localise(section.title);
        if (section.introduction) {
            section.introduction = localise(section.introduction);
        }
        return section;
    };

    const translateField = field => {
        field.label = localise(field.label);
        field.explanation = localise(field.explanation);
        const match = find(formData, (value, name) => name === field.name);

        if (match) {
            // @TODO: How should this logic be handled?
            // Should we split up date field into multiple parts in the UI?
            if (field.type === 'date') {
                field.value = moment(match)
                    .locale(locale)
                    .format('YYYY-MM-DD');
            } else {
                field.value = match;
            }
        }

        // Translate each option (if set)
        if (field.options) {
            field.options = field.options.map(option => {
                option.label = localise(option.label);
                option.explanation = localise(option.explanation);
                return option;
            });
        }
        return field;
    };

    const translateStep = step => {
        step.title = localise(step.title);

        step.fieldsets = step.fieldsets.map(fieldset => {
            fieldset.legend = localise(fieldset.legend);
            fieldset.introduction = localise(fieldset.introduction);
            fieldset.fields = fieldset.fields.map(translateField);
            return fieldset;
        });

        return step;
    };

    const clonedForm = cloneDeep(formModel);
    clonedForm.title = localise(formModel.title);

    clonedForm.sections = clonedForm.sections.map(section => {
        section = translateSection(section);
        section.steps = section.steps.map(step => translateStep(step));
        return section;
    });

    if (clonedForm.termsFields) {
        clonedForm.termsFields = clonedForm.termsFields.map(translateField);
    }

    if (clonedForm.titleField) {
        clonedForm.titleField = translateField(clonedForm.titleField);
    }

    return clonedForm;
}

function determineState(data, errors = []) {
    if (isEmpty(data)) {
        return FORM_STATES.empty;
    } else if (errors.length > 0) {
        return FORM_STATES.incomplete;
    } else {
        return FORM_STATES.complete;
    }
}

/**
 * Build up a set of state parameters for steps, sections, and the form itself
 * eg. to show status on the summary page
 */
function injectFormState(form, data) {
    const clonedForm = cloneDeep(form);

    const validationResult = form.schema.validate(data, {
        abortEarly: false,
        stripUnknown: true
    });

    const errors = getOr([], 'details', validationResult.error);

    clonedForm.sections = clonedForm.sections.map(section => {
        const fieldNamesForSection = flatMapDeep(section.steps, step => {
            return step.fieldsets.map(fieldset => fieldset.fields.map(field => field.name));
        });

        const dataForSection = pick(validationResult.value, fieldNamesForSection);

        const errorsForSection = errors.filter(detail => {
            return includes(fieldNamesForSection, detail.context.key);
        });

        section.state = determineState(dataForSection, errorsForSection);

        section.steps = section.steps.map(step => {
            // Handle steps that this user doesn't need to complete
            if (step.matchesCondition && step.matchesCondition(data) === false) {
                step.notRequired = true;
            }

            return step;
        });

        return section;
    });

    clonedForm.state = determineState(validationResult.value, errors);

    return clonedForm;
}

function getFieldsForStep(step) {
    return flatMap(step.fieldsets, fieldset => fieldset.fields);
}

function getFieldsForSection(section) {
    return flatMap(section.steps, getFieldsForStep);
}

function getAllFields(formModel) {
    return flatMap(formModel.sections, getFieldsForSection);
}

/**
 * Find the next step starting from the given index which should be shown
 * matchesCondition returns a boolean to determine if a step is
 * suitable based on the form data submitted so far.
 *
 * @param {Object} options
 * @param {Object[]} options.steps
 * @param {Function} [options.steps[].matchesCondition]
 * @param {Number} options.startIndex
 * @param {Object} options.formData
 */
function findNextMatchingStepIndex({ steps, startIndex, formData }) {
    return findIndex(
        steps,
        step => (step.matchesCondition ? step.matchesCondition(formData) === true : true),
        startIndex
    );
}

module.exports = {
    FORM_STATES,
    findNextMatchingStepIndex,
    getAllFields,
    getFieldsForSection,
    getFieldsForStep,
    prepareForm,
    injectFormState
};
