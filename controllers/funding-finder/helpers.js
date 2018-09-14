'use strict';
const { toString } = require('lodash');
const queryString = require('query-string');

function reformatQueryString({ originalAreaQuery, originalAmountQuery }) {
    originalAreaQuery = toString(originalAreaQuery).toLowerCase();
    originalAmountQuery = toString(originalAmountQuery).toLowerCase();

    let newQuery = {};
    if (originalAreaQuery) {
        newQuery.location = {
            england: 'england',
            'northern ireland': 'northernIreland',
            scotland: 'scotland',
            wales: 'wales',
            'uk-wide': 'ukWide'
        }[originalAreaQuery];
    }

    if (originalAmountQuery && originalAmountQuery === 'up to 10000') {
        newQuery.max = '10000';
    } else if (originalAmountQuery && originalAmountQuery !== 'up to 10000') {
        newQuery.min = '10000';
    }

    return queryString.stringify(newQuery);
}

module.exports = {
    reformatQueryString
};
