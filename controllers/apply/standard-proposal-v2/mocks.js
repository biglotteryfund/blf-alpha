'use strict';
const random = require('lodash/random');
const faker = require('faker');
const moment = require('moment');

function toDateParts(dt) {
    return { day: dt.date(), month: dt.month() + 1, year: dt.year() };
}

function mockDateOfBirth(minAge, maxAge = 75) {
    const dt = moment().subtract(
        faker.random.number({ min: minAge, max: maxAge }),
        'years'
    );
    return toDateParts(dt);
}

function mockAddress() {
    return {
        line1: faker.address.streetAddress(),
        townCity: faker.address.city(),
        county: faker.address.county(),
        postcode: 'B15 1TR',
    };
}

function mockResponse(overrides = {}) {
    const defaults = {
        projectName: 'My project',
        projectCountries: ['england'],
        projectRegions: ['north-west'],
        projectLocation: 'lancashire',
        projectLocationDescription: 'description',
        projectLocationPostcode: 'B15 1TR',
        projectTotalCost: '300,000',
        projectCosts: '250000',
        projectSpend: faker.lorem.words(random(50, 300)),
        projectStartDate: {
            day: moment().date(),
            month: moment().month() + 1,
            year: moment().year(),
        },
        projectDurationYears: 1,
        yourIdeaProject: faker.lorem.words(random(50, 500)),
        yourIdeaCommunity: faker.lorem.words(random(50, 500)),
        yourIdeaActivities: faker.lorem.words(random(50, 350)),
        projectOrganisation: faker.lorem.words(random(50, 500)),
        beneficiariesGroupsCheck: 'yes',
        beneficiariesGroups: [
            'ethnic-background',
            'gender',
            'age',
            'disabled-people',
            'religion',
            'lgbt',
            'caring-responsibilities',
        ],
        beneficiariesGroupsOther: undefined,
        beneficiariesGroupsEthnicBackground: ['african', 'caribbean'],
        beneficiariesGroupsGender: ['non-binary'],
        beneficiariesGroupsAge: ['0-12', '13-24'],
        beneficiariesGroupsDisabledPeople: ['sensory'],
        beneficiariesGroupsReligion: ['sikh'],
        beneficiariesGroupsReligionOther: undefined,
        organisationLegalName: 'Example organisation',
        organisationTradingName: 'Example trading name',
        organisationDifferentName: 'no',
        organisationAddress: {
            line1: '1234 example street',
            townCity: 'Birmingham',
            county: 'West Midlands',
            postcode: 'B15 1TR',
        },
        organisationStartDate: {
            day: moment().date(),
            month: moment().month() + 1,
            year: moment().subtract(1, 'year').year(),
        },
        organisationSupport: '5',
        organisationVolunteers: '6',
        organisationFullTimeStaff: '7',
        accountingYearDate: {
            day: moment().date(),
            month: moment().month() + 1,
        },
        totalIncomeYear: '200,000',
        organisationType: 'not-for-profit-company',
        seniorContactRole: 'company-director',
        seniorContactDateOfBirth: mockDateOfBirth(18),
        seniorContactAddress: mockAddress(),
        seniorContactAddressHistory: {
            currentAddressMeetsMinimum: 'yes',
            previousAddress: null,
        },
        seniorContactEmail: faker.internet.exampleEmail(),
        seniorContactPhone: '020 7211 1888',
        seniorContactCommunicationNeeds: '',
        mainContactName: {
            firstName: faker.name.firstName(),
            lastName: faker.name.lastName(),
        },
        mainContactDateOfBirth: mockDateOfBirth(16),
        mainContactAddress: mockAddress(),
        mainContactAddressHistory: {
            currentAddressMeetsMinimum: 'no',
            previousAddress: mockAddress(),
        },
        mainContactEmail: faker.internet.exampleEmail(),
        mainContactPhone: '028 9568 0143',
        mainContactCommunicationNeeds: '',
        seniorContactName: {
            firstName: faker.name.firstName(),
            lastName: faker.name.lastName(),
        },
        termsAgreement1: 'yes',
        termsAgreement2: 'yes',
        termsAgreement3: 'yes',
        termsAgreement4: 'yes',
        termsAgreement5: 'yes',
        termsAgreement6: 'yes',
        termsPersonName: `${faker.name.firstName()} ${faker.name.lastName()}`,
        termsPersonPosition: faker.name.jobTitle(),
    };

    return Object.assign(defaults, overrides);
}

module.exports = {
    mockResponse,
};
