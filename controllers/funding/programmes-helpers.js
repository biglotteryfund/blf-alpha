'use strict';
const { find, get, uniq, toString } = require('lodash');
const queryString = require('query-string');

const programmeFilters = {
    getValidLocation(programmes, requestedLocation) {
        const validLocations = programmes
            .map(programme => get(programme, 'content.area.value', false))
            .filter(location => location !== false);

        const uniqLocations = uniq(validLocations);
        return find(uniqLocations, location => location === requestedLocation);
    },
    filterByLocation(locationValue) {
        return function(programme) {
            if (!locationValue) {
                return programme;
            }

            const area = get(programme.content, 'area');
            return area.value === locationValue;
        };
    },
    filterByMinAmount(minAmount) {
        return function(programme) {
            if (!minAmount) {
                return programme;
            }

            const data = programme.content;
            const min = parseInt(minAmount, 10);
            return !data.fundingSize || !min || data.fundingSize.minimum >= min;
        };
    },
    filterByMaxAmount(maxAmount) {
        return function(programme) {
            if (!maxAmount) {
                return programme;
            }

            const max = parseInt(maxAmount, 10);
            const programmeMax = get(programme, 'content.fundingSize.maximum');
            return programmeMax <= max || false;
        };
    }
};

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
    programmeFilters,
    reformatQueryString
};
