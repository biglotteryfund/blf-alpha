'use strict';
const moment = require('moment');
const { find, isArray, sumBy } = require('lodash');

/**
 * Format field values for display in views
 * Try common display formats based on type
 * Otherwise, call toString on the result
 *
 * @param {object} field
 * @param {any} value
 */
module.exports = function displayFormat(field, value) {
    if (field.type === 'radio') {
        const optionMatch = find(field.options, option => option.value === value);
        return optionMatch ? optionMatch.label : value.toString();
    } else if (field.type === 'address') {
        return [value['building-street'], value['town-city'], value['county'], value['postcode']].join(',\n');
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
    } else if (field.type === 'budget') {
        if (!isArray(value)) {
            return value;
        } else {
            const total = sumBy(value, item => parseInt(item.cost || 0));
            return [
                value.map(line => `${line.item} – £${line.cost.toLocaleString()}`).join('\n'),
                `Total: £${total}`
            ].join('\n');
        }
    } else {
        return value.toString();
    }
};
