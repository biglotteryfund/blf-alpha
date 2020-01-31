'use strict';
const config = require('config');

module.exports = function getLeadTimeWeeks(
    country,
    enableVariableLeadTime = config.get('awardsForAll.enableNewDateRange')
) {
    if (enableVariableLeadTime) {
        const countryLeadTimes = {
            'england': 18,
            'northern-ireland': 12,
            'scotland': 12,
            'wales': 18
        };

        return countryLeadTimes[country] || 18;
    } else {
        return 18;
    }
};
