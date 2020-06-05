'use strict';
const random = require('lodash/random');
const faker = require('faker');

function mockResponse(overrides = {}) {
    const defaults = {
        projectName: 'My project',
        projectCountries: ['england'],
        projectRegions: ['midlands'],
        projectLocation: 'derbyshire',
        projectLocationDescription: 'description',
        projectCosts: '250,000',
        projectDurationYears: 1,
        yourIdeaProject: faker.lorem.words(random(50, 500)),
        yourIdeaCommunity: faker.lorem.words(random(50, 500)),
        yourIdeaActivities: faker.lorem.words(random(50, 350)),
        organisationLegalName: 'Example organisation',
        organisationTradingName: 'Example trading name',
        organisationAddress: {
            line1: '1234 example street',
            townCity: 'Birmingham',
            county: 'West Midlands',
            postcode: 'B15 1TR',
        },
        organisationType: 'not-for-profit-company',
        contactName: {
            firstName: 'Björk',
            lastName: 'Guðmundsdóttir',
        },
        contactEmail: 'general.enquiries@tnlcommunityfund.org.uk',
        contactPhone: '028 9568 0143',
        contactCommunicationNeeds: 'Large print',
    };

    return Object.assign(defaults, overrides);
}

module.exports = {
    mockResponse,
};
