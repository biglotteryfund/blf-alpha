'use strict';
const toInteger = require('lodash/toInteger');
const isString = require('lodash/isString');
const moment = require('moment');

module.exports = function fromDateParts(value) {
    if (isString(value)) {
        return moment(value);
    } else {
        return moment({
            year: toInteger(value.year),
            // month is 0 indexed when constructing a date object
            month: toInteger(value.month) - 1,
            day: toInteger(value.day)
        });
    }
};
