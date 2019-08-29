'use strict';
const moment = require('moment');
const castArray = require('lodash/castArray');
const compact = require('lodash/compact');
const filter = require('lodash/filter');
const flatMap = require('lodash/flatMap');
const get = require('lodash/fp/get');
const includes = require('lodash/includes');
const isArray = require('lodash/isArray');
const sumBy = require('lodash/sumBy');
const filesize = require('filesize');
const mime = require('mime-types');

const { fromDateParts } = require('./date-parts');
const { countWords } = require('../../../../common/strings');

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
    const meetsMinimum = get('currentAddressMeetsMinimum')(value);
    const previousAddress = get('previousAddress')(value);

    if (previousAddress && meetsMinimum === 'no') {
        return formatAddress(previousAddress);
    } else {
        // @TODO i18n
        return 'Yes';
    }
}

function formatDate(locale) {
    return function(value) {
        const dt = fromDateParts(value);
        return dt.isValid() ? dt.locale(locale).format('D MMMM, YYYY') : '';
    };
}

function formatDateRange(locale) {
    return function(value) {
        if (!value.startDate || !value.endDate) {
            return '';
        } else {
            const startDate = fromDateParts(value.startDate);
            const endDate = fromDateParts(value.endDate);

            if (!startDate.isValid() || !endDate.isValid()) {
                return '';
            } else {
                return `${startDate
                    .locale(locale)
                    .format('D MMMM, YYYY')}–${endDate
                    .locale(locale)
                    .format('D MMMM, YYYY')}`;
            }
        }
    };
}

function formatDayMonth(locale) {
    return function(value) {
        const dt = moment({
            year: moment().year(),
            month: value.month - 1,
            day: value.day
        });

        return dt.isValid() ? dt.locale(locale).format('Do MMMM') : '';
    };
}

function formatMonthYear(locale) {
    return function(value) {
        const dt = moment({
            year: value.year,
            month: value.month - 1,
            day: 1
        });

        return dt.isValid() ? dt.locale(locale).format('MMMM YYYY') : '';
    };
}

function formatCurrency(value) {
    return `£${value.toLocaleString()}`;
}

function formatBudget(locale) {
    const localise = get(locale);
    return function(value) {
        if (!isArray(value)) {
            return value;
        } else {
            const total = sumBy(value, item => parseInt(item.cost, 10) || 0);
            return [
                value
                    .filter(line => line.item && line.cost)
                    .map(
                        line => `${line.item} – £${line.cost.toLocaleString()}`
                    )
                    .join('\n'),
                localise({
                    en: `Total: £${total.toLocaleString()}`,
                    cy: `Cyfanswm: £${total.toLocaleString()}`
                })
            ].join('\n');
        }
    };
}

function formatFile(value) {
    if (value) {
        const mimeType = mime.extension(value.type) || 'File';
        const fileSize = filesize(value.size, { round: 0 });
        return `${value.filename} (${mimeType.toUpperCase()}, ${fileSize})`;
    } else {
        return '';
    }
}

function formatName(value) {
    if (value) {
        return `${value.firstName} ${value.lastName}`;
    } else {
        return '';
    }
}

function formatTextArea(locale) {
    return function(value) {
        const str = value.toString();
        const wordCount = countWords(str);
        const label = locale === 'en' ? 'words' : 'gair';
        return str + `\n\n (${wordCount} ${label})`;
    };
}

function formatDefault(value) {
    return value.toString();
}

function formatterFor(field, locale = 'en') {
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
            formatter = formatDate(locale);
            break;
        case 'date-range':
            formatter = formatDateRange(locale);
            break;
        case 'day-month':
            formatter = formatDayMonth(locale);
            break;
        case 'month-year':
            formatter = formatMonthYear(locale);
            break;
        case 'currency':
            formatter = formatCurrency;
            break;
        case 'budget':
            formatter = formatBudget(locale);
            break;
        case 'file':
            formatter = formatFile;
            break;
        case 'full-name':
            formatter = formatName;
            break;
        case 'textarea':
            formatter = formatTextArea(locale);
            break;
        default:
            formatter = formatDefault;
            break;
    }

    return formatter;
}

module.exports = {
    formatterFor,
    formatDateRange
};
