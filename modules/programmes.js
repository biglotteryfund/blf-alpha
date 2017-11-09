const { find, get, uniq } = require('lodash');

function getValidLocation(programmes, requestedLocation) {
    const validLocations = programmes
        .map(programme => get(programme, 'content.area.value', false))
        .filter(location => location !== false);

    const uniqLocations = uniq(validLocations);
    return find(uniqLocations, location => location === requestedLocation);
}

function filterByLocation(locationValue) {
    return function(programme) {
        if (!locationValue) {
            return programme;
        }

        return (
            !programme.content.area ||
            get(programme.content, 'area.value') === 'ukWide' ||
            get(programme.content, 'area.value') === locationValue
        );
    };
}

function filterByMinAmount(minAmount) {
    return function(programme) {
        if (!minAmount) {
            return programme;
        }

        const data = programme.content;
        const min = parseInt(minAmount, 10);
        return !data.fundingSize || !min || data.fundingSize.minimum >= min;
    };
}

module.exports = {
    getValidLocation,
    filterByLocation,
    filterByMinAmount
};
