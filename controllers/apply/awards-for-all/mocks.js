'use strict';
const faker = require('faker');
const moment = require('moment');
const random = require('lodash/random');

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
        postcode: 'B15 1TR'
    };
}

function mockBeneficiaries(checkAnswer = 'yes') {
    return {
        beneficiariesGroupsCheck: checkAnswer,
        beneficiariesGroups: [
            'ethnic-background',
            'gender',
            'age',
            'disabled-people',
            'religion',
            'lgbt',
            'caring-responsibilities'
        ],
        beneficiariesGroupsOther: 'Other value',
        beneficiariesGroupsEthnicBackground: ['african', 'caribbean'],
        beneficiariesGroupsGender: ['non-binary'],
        beneficiariesGroupsAge: ['0-12', '13-24'],
        beneficiariesGroupsDisabledPeople: ['sensory'],
        beneficiariesGroupsReligion: ['sikh'],
        beneficiariesGroupsReligionOther: undefined
    };
}

function mockResponse(overrides = {}) {
    const defaults = {
        projectName: faker.lorem.words(5),
        projectCountry: 'england',
        projectStartDate: toDateParts(moment().add(18, 'weeks')),
        projectEndDate: toDateParts(moment().add(30, 'weeks')),
        projectLocation: 'derbyshire',
        projectLocationDescription: faker.lorem.sentence(),
        projectPostcode: 'B15 1TR',
        yourIdeaProject: faker.lorem.words(random(50, 250)),
        yourIdeaPriorities: faker.lorem.words(random(50, 100)),
        yourIdeaCommunity: faker.lorem.words(random(50, 150)),
        projectBudget: new Array(5).fill(null).map(() => {
            return {
                item: faker.lorem.words(5),
                cost: faker.random.number({ min: 100, max: 1000 })
            };
        }),
        projectTotalCosts: 20000,
        beneficiariesGroupsCheck: 'yes',
        beneficiariesGroups: [
            'ethnic-background',
            'gender',
            'age',
            'disabled-people',
            'religion',
            'lgbt',
            'caring-responsibilities'
        ],
        beneficiariesGroupsOther: undefined,
        beneficiariesGroupsEthnicBackground: ['african', 'caribbean'],
        beneficiariesGroupsGender: ['non-binary'],
        beneficiariesGroupsAge: ['0-12', '13-24'],
        beneficiariesGroupsDisabledPeople: ['sensory'],
        beneficiariesGroupsReligion: ['sikh'],
        beneficiariesGroupsReligionOther: undefined,
        organisationLegalName: faker.company.companyName(),
        organisationTradingName: faker.company.companyName(),
        organisationStartDate: { month: 9, year: 1986 },
        organisationAddress: mockAddress(),
        organisationType: 'unincorporated-registered-charity',
        organisationSubType: null,
        companyNumber: null,
        charityNumber: '0123456789',
        educationNumber: null,
        accountingYearDate: { day: 1, month: 3 },
        totalIncomeYear: random(1000, 1000000),
        mainContactName: {
            firstName: faker.name.firstName(),
            lastName: faker.name.lastName()
        },
        mainContactDateOfBirth: mockDateOfBirth(16),
        mainContactAddress: mockAddress(),
        mainContactAddressHistory: {
            currentAddressMeetsMinimum: 'no',
            previousAddress: mockAddress()
        },
        mainContactEmail: faker.internet.exampleEmail(),
        mainContactPhone: '0345 4 10 20 30',
        mainContactCommunicationNeeds: '',
        seniorContactName: {
            firstName: faker.name.firstName(),
            lastName: faker.name.lastName()
        },
        seniorContactRole: 'trustee',
        seniorContactDateOfBirth: mockDateOfBirth(18),
        seniorContactAddress: mockAddress(),
        seniorContactAddressHistory: {
            currentAddressMeetsMinimum: 'yes',
            previousAddress: null
        },
        seniorContactEmail: faker.internet.exampleEmail(),
        seniorContactPhone: '020 7211 1888',
        seniorContactCommunicationNeeds: '',
        bankAccountName: faker.company.companyName(),
        bankSortCode: '308087',
        bankAccountNumber: '25337846',
        buildingSocietyNumber: undefined,
        bankStatement: {
            filename: 'example.pdf',
            size: 123,
            type: 'application/pdf'
        },
        termsAgreement1: 'yes',
        termsAgreement2: 'yes',
        termsAgreement3: 'yes',
        termsAgreement4: 'yes',
        termsPersonName: `${faker.name.firstName()} ${faker.name.lastName()}`,
        termsPersonPosition: faker.name.jobTitle()
    };

    return Object.assign({}, defaults, overrides);
}

module.exports = {
    mockAddress,
    mockBeneficiaries,
    mockDateOfBirth,
    mockResponse,
    toDateParts
};
