'use strict';
const moment = require('moment');
const {
    castArray,
    compact,
    filter,
    flatMap,
    get,
    includes,
    isArray,
    sumBy
} = require('lodash');

const { fromDateParts } = require('../../../common/dates');

function formatRadio(field) {
    return function(value) {
        const choices = castArray(value);

        const matches = filter(field.options, option =>
            includes(choices, option.value)
        );

        return matches.length > 0
            ? matches.map(match => match.label).join(',\n')
            : choices.join(', ');
    };
}

function formatCheckbox(field) {
    const options = field.optgroups
        ? flatMap(field.optgroups, o => o.options)
        : field.options;

    return function(value) {
        const choices = castArray(value);

        const matches = filter(options, option =>
            includes(choices, option.value)
        );

        return matches.length > 0
            ? matches.map(match => match.label).join(',\n')
            : choices.join(',\n');
    };
}

function formatAddress(value) {
    return compact([
        value.line1,
        value.townCity,
        value.county,
        value.postcode
    ]).join(',\n');
}

function formatAddressHistory(value) {
    const meetsMinimium = get(value, 'currentAddressMeetsMinimum');
    const previousAddress = get(value, 'previousAddress');

    if (previousAddress && meetsMinimium === 'no') {
        return formatAddress(previousAddress);
    } else {
        return 'yes';
    }
}

function formatDate(value) {
    const dt = fromDateParts(value);
    return dt.isValid() ? dt.format('D MMMM, YYYY') : '';
}

function formatDateRange(value) {
    if (!value.start || !value.end) {
        return '';
    }
    const dates = {
        start: fromDateParts(value.start),
        end: fromDateParts(value.end)
    };
    if (!dates.start.isValid() || !dates.end.isValid()) {
        return '';
    }
    return `${dates.start.format('D MMMM, YYYY')}–${dates.end.format(
        'D MMMM, YYYY'
    )}`;
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
            value
                .map(line => `${line.item} – £${line.cost.toLocaleString()}`)
                .join('\n'),
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
            formatter = formatRadio(field);
            break;
        case 'checkbox':
            formatter = formatCheckbox(field);
            break;
        case 'address':
            formatter = formatAddress;
            break;
        case 'address-history':
            formatter = formatAddressHistory;
            break;
        case 'date':
            formatter = formatDate;
            break;
        case 'date-range':
            formatter = formatDateRange;
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
    formatCheckbox,
    formatRadio,
    formatAddress,
    formatDate,
    formatDayMonth,
    formatCurrency,
    formatBudget
};
