'use strict';
const { values } = require('lodash');
const moment = require('moment');
const faker = require('faker');

const { BENEFICIARY_GROUPS } = require('./constants');
const { toDateParts } = require('../form-router-next/lib/date-parts');

function mockStartDate(weeks) {
    return toDateParts(moment().add(weeks, 'weeks'));
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
        postcode: 'B15 1TR'
    };
}

function mockBudget() {
    return new Array(5).fill(null).map(() => {
        return {
            item: faker.lorem.words(5),
            cost: faker.random.number({ min: 100, max: 1000 })
        };
    });
}

function mockFullForm({
    country = 'england',
    organisationType,
    companyNumber = null,
    charityNumber = null,
    educationNumber = null
}) {
    return {
        projectName: faker.lorem.words(5),
        projectCountry: country,
        projectDateRange: {
            startDate: mockStartDate(12),
            endDate: mockStartDate(30)
        },
        projectLocation: 'west-midlands',
        projectLocationDescription: faker.lorem.sentence(),
        projectPostcode: 'B15 1TR',
        yourIdeaProject: faker.lorem.words(250),
        yourIdeaPriorities: faker.lorem.words(100),
        yourIdeaCommunity: faker.lorem.words(150),
        projectBudget: mockBudget(),
        projectTotalCosts: 20000,
        beneficiariesGroupsCheck: 'yes',
        beneficiariesGroups: values(BENEFICIARY_GROUPS),
        beneficiariesGroupsOther: undefined,
        beneficiariesGroupsEthnicBackground: ['african', 'caribbean'],
        beneficiariesGroupsGender: ['non-binary'],
        beneficiariesGroupsAge: ['0-12', '13-24'],
        beneficiariesGroupsDisabledPeople: ['sensory'],
        beneficiariesGroupsReligion: ['sikh'],
        beneficiariesGroupsReligionOther: undefined,
        organisationLegalName: faker.company.companyName(),
        organisationTradingName: faker.company.companyName(),
        organisationAddress: mockAddress(),
        organisationType: organisationType,
        companyNumber: companyNumber,
        charityNumber: charityNumber,
        educationNumber: educationNumber,
        accountingYearDate: { day: 1, month: 3 },
        totalIncomeYear: faker.random.number({ min: 10000, max: 1000000 }),
        mainContactFirstName: faker.name.firstName(),
        mainContactLastName: faker.name.lastName(),
        mainContactDateOfBirth: mockDateOfBirth(16),
        mainContactAddress: mockAddress(),
        mainContactAddressHistory: {
            currentAddressMeetsMinimum: 'no',
            previousAddress: mockAddress()
        },
        mainContactEmail: faker.internet.exampleEmail(),
        mainContactPhone: '0345 4 10 20 30',
        mainContactCommunicationNeeds: [],
        seniorContactFirstName: faker.name.firstName(),
        seniorContactLastName: faker.name.lastName(),
        seniorContactRole: 'trustee',
        seniorContactDateOfBirth: mockDateOfBirth(18),
        seniorContactAddress: mockAddress(),
        seniorContactAddressHistory: {
            currentAddressMeetsMinimum: 'yes',
            previousAddress: null
        },
        seniorContactEmail: faker.internet.exampleEmail(),
        seniorContactPhone: '020 7211 1888',
        seniorContactCommunicationNeeds: [],
        bankAccountName: faker.company.companyName(),
        bankSortCode: '108800',
        bankAccountNumber: '00012345',
        buildingSocietyNumber: undefined,
        bankStatement: 'example.pdf'
    };
}

module.exports = {
    mockAddress,
    mockBudget,
    mockDateOfBirth,
    mockFullForm,
    mockStartDate
};
