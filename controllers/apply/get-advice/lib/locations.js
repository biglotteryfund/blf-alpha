'use strict';
const includes = require('lodash/includes');
const locationOptions = require('../../lib/location-options');

module.exports = function locationsFor(countries = [], locale = 'en') {
    const locations = locationOptions(locale);

    if (countries.length > 1) {
        return [];
    } else if (includes(countries, 'england')) {
        return locations.england;
    } else if (includes(countries, 'northern-ireland')) {
        return locations.northernIreland;
    } else if (includes(countries, 'scotland')) {
        return locations.scotland;
    } else if (includes(countries, 'wales')) {
        return locations.wales;
    } else {
        return [];
    }
};
