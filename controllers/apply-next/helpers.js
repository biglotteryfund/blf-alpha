'use strict';
const { cloneDeep, find, findIndex, findLastIndex, flatMapDeep, includes, isEmpty, pick } = require('lodash');
const { get, getOr, uniqBy } = require('lodash/fp');
const moment = require('moment');

const FORM_STATES = {
    empty: 'empty',
    invalid: 'invalid',
    incomplete: 'incomplete',
    complete: 'complete'
};

/**
 * Format field values for display in views
 * If the field has a custom displayFormat use that
 * Or, try common display formats based on type
 * Otherwise, call toString on the result
 *
 * @param {any} value
 * @param {object} field
 */
function toDisplayValue(value, field) {
    if (field.displayFormat) {
        return field.displayFormat.call(field, value);
    } else if (field.type === 'radio') {
        const optionMatch = find(field.options, option => option.value === value);
        return optionMatch ? optionMatch.label : value.toString();
    } else if (field.type === 'date') {
        return moment(value).format('D MMMM, YYYY');
    } else {
        return value.toString();
    }
}

/**
 * Enhances a form object by:
 * - Localising all labels and messages
 * - Assigning values to fields, along with a display value for views
 * - Marking steps as notRequired if matchesCondition is currently false
 *
 * @param {String} locale
 * @param {Object} form
 * @param {Object} data
 */
function enhanceForm(locale, form, data) {
    const localise = get(locale);
    const clonedForm = cloneDeep(form);

    const enhanceSection = section => {
        section.title = localise(section.title);
        if (section.introduction) {
            section.introduction = localise(section.introduction);
        }
        return section;
    };

    const enhanceField = field => {
        field.label = localise(field.label);
        field.explanation = localise(field.explanation);

        if (field.options) {
            field.options = field.options.map(option => {
                option.label = localise(option.label);
                option.explanation = localise(option.explanation);
                return option;
            });
        }

        // Assign value to field if present
        const fieldValue = find(data, (value, name) => name === field.name);
        if (fieldValue) {
            field.value = fieldValue;
            field.displayValue = toDisplayValue(fieldValue, field);
        }

        return field;
    };

    const enhanceStep = step => {
        step.title = localise(step.title);

        step.fieldsets = step.fieldsets.map(fieldset => {
            fieldset.legend = localise(fieldset.legend);
            fieldset.introduction = localise(fieldset.introduction);
            fieldset.fields = fieldset.fields.map(enhanceField);
            return fieldset;
        });

        // Handle steps that don't need to be completed based on current form data
        if (step.matchesCondition && step.matchesCondition(data) === false) {
            step.notRequired = true;
        }

        return step;
    };

    clonedForm.title = localise(form.title);

    clonedForm.sections = clonedForm.sections.map(section => {
        section = enhanceSection(section);
        section.steps = section.steps.map(enhanceStep);
        return section;
    });

    if (clonedForm.termsFields) {
        clonedForm.termsFields = clonedForm.termsFields.map(enhanceField);
    }

    if (clonedForm.titleField) {
        clonedForm.titleField = enhanceField(clonedForm.titleField);
    }

    return clonedForm;
}

/**
 * Determine status from data and validation errors
 * @param {Object} data
 * @param {Array} errors
 */
function determineStatus(data, errors = []) {
    if (isEmpty(data)) {
        return FORM_STATES.empty;
    } else if (errors.length > 0) {
        return FORM_STATES.incomplete;
    } else {
        return FORM_STATES.complete;
    }
}

/**
 * Calculate form progress
 * Validates the form and returns a status
 * for each section and the form as a whole.
 *
 * @param {Object} form
 * @param {Object} data
 */
function calculateFormProgress(form, data) {
    const validationResult = form.schema.validate(data, { abortEarly: false, stripUnknown: true });

    const errors = getOr([], 'error.details', validationResult);

    return {
        all: determineStatus(validationResult.value, errors),
        sections: form.sections.reduce((obj, section) => {
            const fieldNames = flatMapDeep(section.steps, step => {
                return step.fieldsets.map(fieldset => fieldset.fields.map(field => field.name));
            });

            const dataForSection = pick(validationResult.value, fieldNames);
            // const errorsForSection = errors.filter(detail => includes(fieldNames, detail.context.key));
            const errorsForSection = errors.filter(detail => includes(fieldNames, detail.path[0]));

            obj[section.slug] = determineStatus(dataForSection, errorsForSection);

            return obj;
        }, {})
    };
}

/**
 * @typedef {object} MatchOptions
 * @property {String} baseUrl
 * @property {Array} sections
 * @property {Number} currentSectionIndex
 * @property {Number} currentStepIndex
 * @property {Object} formData
 */

/**
 * Find next matching URL
 * @param {MatchOptions} options
 */
function findNextMatchingUrl({ baseUrl, sections, currentSectionIndex, currentStepIndex, formData }) {
    const currentSection = sections[currentSectionIndex];
    const nextSection = sections[currentSectionIndex + 1];

    const targetStepIndex = findIndex(
        currentSection.steps,
        step => (step.matchesCondition ? step.matchesCondition(formData) === true : true),
        currentStepIndex + 1
    );

    if (targetStepIndex !== -1 && targetStepIndex <= currentSection.steps.length) {
        return `${baseUrl}/${currentSection.slug}/${targetStepIndex + 1}`;
    } else if (nextSection) {
        return `${baseUrl}/${nextSection.slug}`;
    } else {
        return `${baseUrl}/summary`;
    }
}

/**
 * Find previous matching URL
 * @param {MatchOptions} options
 */
function findPreviousMatchingUrl({ baseUrl, sections, currentSectionIndex, currentStepIndex, formData }) {
    const currentSection = sections[currentSectionIndex];
    const previousSection = sections[currentSectionIndex - 1];

    if (currentStepIndex !== 0) {
        const targetStepIndex = findLastIndex(
            currentSection.steps,
            step => (step.matchesCondition ? step.matchesCondition(formData) === true : true),
            currentStepIndex - 1
        );
        return `${baseUrl}/${currentSection.slug}/${targetStepIndex + 1}`;
    } else if (previousSection) {
        return `${baseUrl}/${previousSection.slug}/${previousSection.steps.length}`;
    } else {
        return baseUrl;
    }
}

/**
 * Find next and previous matching URLs
 * @param {MatchOptions} options
 */
function nextAndPrevious(options) {
    return {
        nextUrl: findNextMatchingUrl(options),
        previousUrl: findPreviousMatchingUrl(options)
    };
}

/**
 * Filter joi error object by given field names
 * In order to avoid showing multiple validation errors per field we find the first error per field name
 * @param {Object} validationError
 * @param {Array<String>} fieldNames
 */
function filterErrors(validationError, fieldNames) {
    const errorDetails = getOr([], 'details')(validationError);
    // return uniqBy(detail => detail.context.key)(
    //     errorDetails.filter(detail => includes(fieldNames, detail.context.key))
    // );
    return uniqBy(detail => detail.path[0])(errorDetails.filter(detail => includes(fieldNames, detail.path[0])));
}

/**
 * Normalise errors for use in views
 * Maps raw joi error objects to a simplified format and
 * determines the appropriate translated error message to
 * use based on a fields current error type.
 *
 * @param {Object} options
 * @param {Array<Object>} options.fields
 * @param {Array<Object>} options.errors
 * @param {String} options.locale
 */
function normaliseErrors({ fields, errors, locale }) {
    return errors.map(detail => {
        // const name = detail.context.key;
        const name = detail.path[0];
        const match = find(fields, field => field.name === name);
        const localeString = get(detail.type)(match.messages) || get('base')(match.messages);
        return { param: name, msg: get(locale)(localeString) };
    });
}

module.exports = {
    FORM_STATES,
    calculateFormProgress,
    enhanceForm,
    filterErrors,
    findNextMatchingUrl,
    findPreviousMatchingUrl,
    nextAndPrevious,
    normaliseErrors
};
