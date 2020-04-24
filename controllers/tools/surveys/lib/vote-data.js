'use strict';
const moment = require('moment');
const times = require('lodash/times');

const {
    getOldestDate,
    getDaysInRange,
    groupByCreatedAt,
} = require('../../lib/date-helpers');

module.exports = function voteDataFor(responses) {
    if (responses.length === 0) {
        return [];
    }

    const grouped = groupByCreatedAt(responses);
    const oldestDate = getOldestDate(responses);

    return times(getDaysInRange(responses) + 1, function (n) {
        const key = moment(oldestDate)
            .clone()
            .add(n, 'days')
            .format('YYYY-MM-DD');

        const responsesForDay = grouped[key] || [];

        const yesResponsesForDay = responsesForDay.filter(
            (response) => response.choice === 'yes'
        );

        return {
            x: key,
            y: Math.round(
                (yesResponsesForDay.length / responsesForDay.length) * 100
            ),
        };
    });
};
