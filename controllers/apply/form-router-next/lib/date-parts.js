'use strict';
const { toInteger } = require('lodash');
const moment = require('moment');

function fromDateParts(parts) {
    return moment({
        year: toInteger(parts.year),
        // month is 0 indexed when constructing a date object
        month: toInteger(parts.month) - 1,
        day: toInteger(parts.day)
    });
}

function toDateParts(dt) {
    return {
        day: dt.date(),
        month: dt.month() + 1,
        year: dt.year()
    };
}

module.exports = {
    fromDateParts,
    toDateParts
};
