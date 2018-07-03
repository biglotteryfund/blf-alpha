'use strict';

const { HUB_EMAILS } = require('../../modules/secrets');

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

module.exports = {
    PROJECT_LOCATIONS,
    DEFAULT_EMAIL
};
