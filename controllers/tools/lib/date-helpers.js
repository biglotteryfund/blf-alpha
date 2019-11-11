'use strict';
const moment = require('moment');
const groupBy = require('lodash/groupBy');
const maxBy = require('lodash/maxBy');
const minBy = require('lodash/minBy');

function getDateRange(startVal, endVal) {
    let result;
    if (startVal) {
        const now = moment();

        const start = moment(startVal).isValid()
            ? moment(startVal).set({ hour: 0, minute: 0, second: 0 })
            : now;

        const end =
            endVal && moment(endVal).isValid()
                ? moment(endVal).set({ hour: 23, minute: 59, second: 59 })
                : now;

        result = {
            start: start.toDate(),
            end: end.toDate()
        };
    }
    return result;
}

function groupByCreatedAt(items, dateFormat = 'YYYY-MM-DD') {
    return groupBy(items, function(response) {
        return moment(response.createdAt).format(dateFormat);
    });
}

function getOldestDate(items) {
    const oldest = minBy(items, response => response.createdAt);
    return oldest.createdAt;
}

function getNewestDate(items) {
    const newest = maxBy(items, response => response.createdAt);
    return newest.createdAt;
}

function getDaysInRange(items) {
    return moment(getNewestDate(items))
        .startOf('day')
        .diff(moment(getOldestDate(items)).startOf('day'), 'days');
}

module.exports = {
    getDateRange,
    groupByCreatedAt,
    getOldestDate,
    getNewestDate,
    getDaysInRange
};
