'use strict';

module.exports = function getLeadTimeWeeks(country) {
    const countryLeadTimes = {
        'england': 18,
        'northern-ireland': 12,
        'scotland': 12,
        'wales': 12,
    };

    return countryLeadTimes[country] || 18;
};
