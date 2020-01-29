'use strict';
const config = require('config');

module.exports = function getLeadTimeWeeks(
    country,
    enableVariableLeadTime = config.get('awardsForAll.enableNewDateRange')
) {
    if (enableVariableLeadTime) {
        if (country === 'england') {
            return 18;
        } else {
            return 12;
        }
    } else {
        return 18;
    }
};
