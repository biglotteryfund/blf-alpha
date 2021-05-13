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
        postcode: 'B15 1TR',
    };
}

function mockBeneficiaries(checkAnswer = 'yes') {
    if (checkAnswer === 'yes') {
        return {
            beneficiariesPreflightCheck: 'yes',
            beneficiariesGroupsCheck: checkAnswer,
            beneficiariesGroups: [
                'ethnic-background',
                'gender',
                'age',
                'disabled-people',
                'religion',
                'lgbt',
                'migrant',
                'socioeconomic',
                'other',
            ],
            beneficiariesGroupsEthnicBackground: ['mixed-black', 'chinese'],
            beneficiariesGroupsAge: ['16-18'],
            beneficiariesGroupsDisabledPeople: ['mental-health'],
            beneficiariesGroupsReligion: ['sikh'],
            beneficiariesGroupsMigrant: ['asylum-seeker'],
            beneficiariesGroupsLGBT: ['other-lgbt'],
            beneficiariesGroupsOther: checkAnswer === 'yes' ? faker.lorem.words(random(20, 100)) : "",
            beneficiariesLeadershipGroups: ['ethnic-background', 'lgbt'],
            beneficiariesLeadershipGroupsEthnicBackground: [
                'mixed-black',
                'chinese',
            ],
            beneficiariesLeadershipGroupsLGBT: ['non-binary'],
            beneficiariesLeadershipGroupsOther: checkAnswer === 'yes' ? 'Example specific group' : "",
        };
    } else {
        return {
            beneficiariesPreflightCheck: 'yes',
            beneficiariesGroupsCheck: checkAnswer,
        };
    }
}

function mockResponse(overrides = {}) {
    const defaults = {
        projectName: faker.lorem.words(5),
        projectCountry: 'england',
        projectStartDateCheck: 'asap',
        projectStartDate: toDateParts(moment().add(18, 'weeks')),
        projectEndDate: toDateParts(moment().add(5, 'months')),
        projectLocation: 'derbyshire',
        projectLocationDescription: faker.lorem.sentence(),
        projectPostcode: 'B15 1TR',
        yourIdeaProject: faker.lorem.words(random(50, 250)),
        yourIdeaPriorities: faker.lorem.words(random(50, 100)),
        yourIdeaCommunity: faker.lorem.words(random(50, 150)),
        projectBudget: new Array(5).fill(null).map(() => {
            return {
                item: faker.lorem.words(5),
                cost: faker.random.number({ min: 100, max: 1000 }),
            };
        }),
        projectTotalCosts: 20000,
        beneficiariesPreflightCheck: 'yes',
        beneficiariesGroupsCheck: 'yes',
        beneficiariesGroups: [
            'ethnic-background',
            'gender',
            'age',
            'disabled-people',
            'religion',
            'lgbt',
            'migrant',
            'socioeconomic',
            'other',
        ],
        beneficiariesGroupsEthnicBackground: ['mixed-black', 'chinese'],
        beneficiariesGroupsAge: ['16-18'],
        beneficiariesGroupsDisabledPeople: ['mental-health'],
        beneficiariesGroupsReligion: ['sikh'],
        beneficiariesGroupsMigrant: ['asylum-seeker'],
        beneficiariesGroupsLGBT: ['other-lgbt'],
        beneficiariesGroupsOther: faker.lorem.words(random(20, 100)),
        beneficiariesLeadershipGroups: ['ethnic-background', 'lgbt'],
        beneficiariesLeadershipGroupsEthnicBackground: [
            'mixed-black',
            'chinese',
        ],
        beneficiariesLeadershipGroupsLGBT: ['non-binary'],
        beneficiariesLeadershipGroupsOther: 'Example specific group',
        organisationLegalName: faker.company.companyName(),
        organisationHasDifferentTradingName: 'yes',
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
        seniorContactRole: 'trustee',
        seniorContactDateOfBirth: mockDateOfBirth(18),
        seniorContactAddress: mockAddress(),
        seniorContactAddressHistory: {
            currentAddressMeetsMinimum: 'yes',
            previousAddress: null,
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
            type: 'application/pdf',
        },
        termsAgreement1: 'yes',
        termsAgreement2: 'yes',
        termsAgreement3: 'yes',
        termsAgreement4: 'yes',
        termsAgreementCovid1: 'yes',
        termsAgreementCovid2: 'yes',
        termsAgreementCovid3: 'yes',
        termsPersonName: `${faker.name.firstName()} ${faker.name.lastName()}`,
        termsPersonPosition: faker.name.jobTitle(),
    };

    return Object.assign({}, defaults, overrides);
}

module.exports = {
    mockAddress,
    mockBeneficiaries,
    mockDateOfBirth,
    mockResponse,
    toDateParts,
};
