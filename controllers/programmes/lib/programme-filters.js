'use strict';
const get = require('lodash/get');

module.exports = {
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
            const programmeMin = get(programme, 'fundingSize.minimum');
            return !programmeMin || !min || programmeMin >= min;
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
