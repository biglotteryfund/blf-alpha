'use strict';
const { cloneDeep, find, findIndex, flatMap, isEmpty, pick } = require('lodash');
const { get, getOr } = require('lodash/fp');

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
            field.value = match;
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

    return clonedForm;
}

/**
 * Build up a set of state parameters for steps, sections, and the form itself
 * eg. to show status on the summary page
 */
function validateFormState(form, formData, sessionValidation) {
    const clonedForm = cloneDeep(form);

    clonedForm.sections = clonedForm.sections.map(section => {
        section.steps = section.steps.map((step, stepIndex) => {
            // Handle steps that this user doesn't need to complete
            if (step.matchesCondition && step.matchesCondition(formData) === false) {
                step.state = FORM_STATES.complete;
                step.notRequired = true;
            } else {
                const fieldsForStep = getFieldsForStep(step);
                const stepData = pick(formData, fieldsForStep.map(field => field.name));

                if (isEmpty(stepData)) {
                    step.state = FORM_STATES.empty;
                } else {
                    // @TODO construct this via a function
                    const stepIsValid = getOr(false, `${section.slug}.step-${stepIndex}`)(sessionValidation);
                    step.state = stepIsValid ? FORM_STATES.complete : FORM_STATES.incomplete;
                }
            }

            return step;
        });

        // See if this section's steps are all empty
        const sectionIsNotEmpty = section.steps
            .filter(step => !step.notRequired)
            .some(step => step.state !== FORM_STATES.empty);

        if (sectionIsNotEmpty) {
            // Work out this section's state based on its steps' state
            const sectionHasInvalidSteps = section.steps
                .filter(step => step.notRequired === undefined)
                .some(step => step.state !== FORM_STATES.complete);
            section.state = sectionHasInvalidSteps ? FORM_STATES.incomplete : FORM_STATES.complete;
        } else {
            section.state = FORM_STATES.empty;
        }

        return section;
    });

    // Check whether the entire form is empty
    const formIsNotEmpty = clonedForm.sections.some(section => section.state !== FORM_STATES.empty);

    if (formIsNotEmpty) {
        // Work out the entire form's state based on its sections' state
        const formHasInvalidSections = clonedForm.sections.some(section => section.state !== FORM_STATES.complete);
        clonedForm.state = formHasInvalidSections ? FORM_STATES.incomplete : FORM_STATES.complete;
    } else {
        clonedForm.state = FORM_STATES.empty;
    }
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
 * @param {Object[]} steps
 * @param {Function} [steps[].matchesCondition]
 * @param {Number} startIndex
 * @param {Object} formData
 */
function findNextMatchingStepIndex(steps, startIndex, formData) {
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
    validateFormState
};
