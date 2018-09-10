'use strict';
const { get, groupBy, sortBy, isArray } = require('lodash');

const HUB_EMAILS = {
    england: 'englandteam@biglotteryfund.org.uk',
    londonSouthEast: 'londonandsoutheastteam@biglotteryfund.org.uk',
    midlands: 'midlandsteam@biglotteryfund.org.uk',
    northEastCumbria: 'neandcumbriateam@biglotteryfund.org.uk',
    northWest: 'northwestteam@biglotteryfund.org.uk',
    southWest: 'southwestteam@biglotteryfund.org.uk',
    yorksHumber: 'yorksandhumberteam@biglotteryfund.org.uk'
};

const PROJECT_LOCATIONS = [
    {
        label: 'North East & Cumbria',
        value: 'North East & Cumbria',
        explanation: 'covering Newcastle, Cumbria and the north-east of England',
        email: HUB_EMAILS.northEastCumbria
    },
    {
        label: 'North West',
        value: 'North West',
        explanation: 'covering Greater Manchester, Lancashire, Cheshire and Merseyside',
        email: HUB_EMAILS.northWest
    },
    {
        label: 'Yorkshire and the Humber',
        value: 'Yorkshire and the Humber',
        explanation: 'covering Yorkshire, north and north-east Lincolnshire',
        email: HUB_EMAILS.yorksHumber
    },
    {
        label: 'South West',
        value: 'South West',
        explanation: 'covering Exeter, Bristol and the south-west of England',
        email: HUB_EMAILS.southWest
    },
    {
        label: 'London, South East and East of England',
        value: 'London and South East',
        email: HUB_EMAILS.londonSouthEast
    },
    {
        label: 'East and West Midlands',
        value: 'Midlands',
        email: HUB_EMAILS.midlands
    }
];

const DEFAULT_EMAIL = HUB_EMAILS.england;

/**
 * Determine which internal address to send to:
 * - If multi-region, send to default/england-wide inbox
 * - Otherwise send to the matching inbox for the selected region
 */
function determineInternalSendTo(location) {
    if (isArray(location)) {
        return DEFAULT_EMAIL;
    } else {
        const matchedLocation = PROJECT_LOCATIONS.find(l => l.value === location);
        return get(matchedLocation, 'email', DEFAULT_EMAIL);
    }
}

/**
 * Rank steps by their internal order (if provided), falling back to original (source) order
 */
function orderStepsForInternalUse(stepData) {
    const stepGroups = groupBy(stepData, s => (s.internalOrder ? 'ordered' : 'unordered'));
    return sortBy(stepGroups.ordered, 'internalOrder').concat(stepGroups.unordered);
}

module.exports = {
    DEFAULT_EMAIL,
    PROJECT_LOCATIONS,
    determineInternalSendTo,
    orderStepsForInternalUse
};
