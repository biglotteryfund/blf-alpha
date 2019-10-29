'use strict';
const moment = require('moment');

function getStart(startVal) {
    const start = moment(startVal);
    return start.isValid()
        ? start.set({
              hour: 0,
              minute: 0,
              second: 0
          })
        : moment();
}

function getEnd(endVal) {
    const end = endVal ? moment(endVal) : moment();
    return end.isValid()
        ? end.set({
              hour: 23,
              minute: 59,
              second: 59
          })
        : moment();
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
