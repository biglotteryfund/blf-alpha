'use strict';
const { find, get, uniq } = require('lodash');

function getValidLocation(programmes, requestedLocation) {
    const validLocations = programmes
        .map(programme => get(programme, 'area.value', false))
        .filter(location => location !== false);

    const uniqLocations = uniq(validLocations);
    return find(uniqLocations, location => location === requestedLocation);
}

const programmeFilters = {
    filterByLocation(locationValue) {
        return function(programme) {
            if (!locationValue) {
                return programme;
            }

            const area = get(programme, 'area');
            return area.value === locationValue;
        };
    },
    filterByMinAmount(minAmount) {
        return function(programme) {
            if (!minAmount) {
                return programme;
            }

            const min = parseInt(minAmount, 10);
            return !programme.fundingSize || !min || programme.fundingSize.minimum >= min;
        };
    },
    filterByMaxAmount(maxAmount) {
        return function(programme) {
            if (!maxAmount) {
                return programme;
            }

            const max = parseInt(maxAmount, 10);
            const programmeMax = get(programme, 'fundingSize.maximum');
            return programmeMax <= max || false;
        };
    }
};

module.exports = {
    getValidLocation,
    programmeFilters
};
