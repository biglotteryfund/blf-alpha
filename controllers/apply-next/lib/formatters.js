'use strict';
const moment = require('moment');
const { castArray, filter, includes, isArray, sumBy } = require('lodash');

function formatOptions(options) {
    return function(value) {
        const choices = castArray(value);
        const matches = filter(options, option => includes(choices, option.value));
        return matches.length > 0 ? matches.map(match => match.label).join(', ') : choices.join(', ');
    };
}

function formatAddress(value) {
    return [value['building-street'], value['town-city'], value['county'], value['postcode']].join(',\n');
}

function formatDate(value) {
    const dt = moment({
        year: value.year,
        month: value.month - 1,
        day: value.day
    });

    return dt.isValid() ? dt.format('D MMMM, YYYY') : '';
}

function formatDayMonth(value) {
    const dt = moment({
        year: moment().year(),
        month: value.month - 1,
        day: value.day
    });

    return dt.isValid() ? dt.format('Do MMMM') : '';
}

function formatCurrency(value) {
    return `£${value.toLocaleString()}`;
}

function formatBudget(value) {
    if (!isArray(value)) {
        return value;
    } else {
        const total = sumBy(value, item => parseInt(item.cost || 0));
        return [
            value.map(line => `${line.item} – £${line.cost.toLocaleString()}`).join('\n'),
            `Total: £${total.toLocaleString()}`
        ].join('\n');
    }
}

function formatDefault(value) {
    return value.toString();
}

function formatterFor(field) {
    let formatter;
    switch (field.type) {
        case 'radio':
        case 'checkbox':
            formatter = formatOptions(field.options);
            break;
        case 'address':
            formatter = formatAddress;
            break;
        case 'date':
            formatter = formatDate;
            break;
        case 'day-month':
            formatter = formatDayMonth;
            break;
        case 'currency':
            formatter = formatCurrency;
            break;
        case 'budget':
            formatter = formatBudget;
            break;
        default:
            formatter = formatDefault;
            break;
    }

    return formatter;
}

module.exports = {
    formatterFor,
    formatOptions,
    formatAddress,
    formatDate,
    formatDayMonth,
    formatCurrency,
    formatBudget
};
