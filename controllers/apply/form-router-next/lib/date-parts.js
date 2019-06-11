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

module.exports = {
    fromDateParts
};
