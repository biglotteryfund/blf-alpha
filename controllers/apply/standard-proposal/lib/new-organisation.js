'use strict';
const toInteger = require('lodash/toInteger');
const moment = require('moment');

const { ORG_MIN_AGE } = require('../constants');

module.exports = function isNewOrganisation(dayMonth = {}) {
    const minDate = moment().subtract(ORG_MIN_AGE.amount, ORG_MIN_AGE.unit);
    return minDate.isSameOrBefore(
        moment({
            year: toInteger(dayMonth.year),
            month: toInteger(dayMonth.month) - 1,
            day: 1,
        })
    );
};
