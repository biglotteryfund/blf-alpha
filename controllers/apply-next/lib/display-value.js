'use strict';
const moment = require('moment');
const { find } = require('lodash');

/**
 * Format field values for display in views
 * If the field has a custom displayFormat use that
 * Or, try common display formats based on type
 * Otherwise, call toString on the result
 *
 * @param {object} field
 * @param {any} value
 */
module.exports = function displayValue(field, value) {
    if (field.displayFormat) {
        return field.displayFormat.call(field, value);
    } else if (field.type === 'radio') {
        const optionMatch = find(field.options, option => option.value === value);
        return optionMatch ? optionMatch.label : value.toString();
    } else if (field.type === 'date') {
        const dt = moment({
            year: value.year,
            month: value.month - 1,
            day: value.day
        });
        if (dt.isValid()) {
            return dt.format('D MMMM, YYYY');
        } else {
            return '';
        }
    } else if (field.type === 'day-month') {
        const dt = moment({
            year: moment().year(),
            month: value.month - 1,
            day: value.day
        });
        if (dt.isValid()) {
            return dt.format('Do MMMM');
        } else {
            return '';
        }
    } else if (field.type === 'currency') {
        return `£${value.toLocaleString()}`;
    } else {
        return value.toString();
    }
};
