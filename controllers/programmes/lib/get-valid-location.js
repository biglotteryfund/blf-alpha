'use strict';
const find = require('lodash/find');
const get = require('lodash/get');
const uniq = require('lodash/uniq');

module.exports = function getValidLocation(programmes, requestedLocation) {
    const validLocations = programmes
        .map(programme => get(programme, 'area.value', false))
        .filter(location => location !== false);

    const uniqLocations = uniq(validLocations);
    return find(uniqLocations, location => location === requestedLocation);
};
