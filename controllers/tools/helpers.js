'use strict';
const moment = require('moment');

function getStart(startVal) {
    const start = moment(startVal);
    return start.isValid() ? start : moment();
}

function getEnd(endVal) {
    const end = endVal ? moment(endVal) : moment();
    return end.isValid() ? end : moment();
}

function getDateRange(startVal, endVal) {
    let result;
    if (startVal) {
        result = {
            start: getStart(startVal).toDate(),
            end: getEnd(endVal).toDate()
        };
    }
    return result;
}

module.exports = {
    getDateRange
};
