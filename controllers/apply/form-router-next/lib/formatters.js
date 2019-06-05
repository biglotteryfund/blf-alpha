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
const filesize = require('filesize');
const mime = require('mime-types');

const { fromDateParts } = require('./date-parts');

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

function formatMultiChoice(field) {
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
    if (!value.startDate || !value.endDate) {
        return '';
    } else {
        const startDate = fromDateParts(value.startDate);
        const endDate = fromDateParts(value.endDate);

        if (!startDate.isValid() || !endDate.isValid()) {
            return '';
        } else {
            return `${startDate.format('D MMMM, YYYY')}–${endDate.format(
                'D MMMM, YYYY'
            )}`;
        }
    }
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

function formatFile(value) {
    if (value) {
        return `${value.filename} (${mime
            .extension(value.type)
            .toUpperCase()}, ${filesize(value.size, { round: 0 })})`;
    } else {
        return '';
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
            formatter = formatMultiChoice(field);
            break;
        case 'select':
            formatter = formatMultiChoice(field);
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
        case 'file':
            formatter = formatFile;
            break;
        default:
            formatter = formatDefault;
            break;
    }

    return formatter;
}

module.exports = {
    formatterFor,
    formatDate,
    formatDateRange
};
