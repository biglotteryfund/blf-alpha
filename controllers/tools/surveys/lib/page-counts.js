'use strict';
const countBy = require('lodash/countBy');
const map = require('lodash/map');
const orderBy = require('lodash/orderBy');

module.exports = function pageCountsFor(responses) {
    return orderBy(
        map(countBy(responses, 'path'), function (val, key) {
            return { path: key, count: val };
        }),
        'count',
        'desc'
    );
};
