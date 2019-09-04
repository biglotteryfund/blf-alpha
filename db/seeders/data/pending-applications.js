'use strict';
const faker = require('faker');
const moment = require('moment');
const uuidv4 = require('uuid/v4');
const { Users } = require('../../models');

const projectCountries = ['scotland', 'wales', 'england', 'northern-ireland'];
const expiryDates = [
    moment().add('30', 'days'),
    moment().add('14', 'days'),
    moment().add('2', 'days'),
    moment(),
    moment().subtract('5', 'days')
];

const toDateParts = dt => {
    return { day: dt.date(), month: dt.month() + 1, year: dt.year() };
};

const mockAddress = () => {
    return {
        line1: faker.address.streetAddress(),
        townCity: faker.address.city(),
        county: faker.address.county(),
        postcode: 'B15 1TR'
    };
};

const generateRandomApplicationData = () => {
    return {
        accountingYearDate: {
            day: faker.random.number({ min: 1, max: 28 }),
            month: faker.random.number({ min: 1, max: 12 })
        },
        bankAccountName: faker.finance.accountName(),
        bankAccountNumber: faker.finance.account(),
        bankSortCode: faker.finance.account(6),
        bankStatement: {
            size: 123,
            type: "application/pdf",
            filename: "example.pdf"
        },
        buildingSocietyNumber: faker.random.alphaNumeric(8),
        beneficiariesGroupsCheck: 'no',
        beneficiariesGroupsReligionOther: "",
        charityNumber: faker.finance.account(7),
        mainContactName: {
            lastName: faker.name.lastName(),
            firstName: faker.name.firstName()
        },
        mainContactEmail: faker.internet.email(),
        mainContactDateOfBirth: toDateParts(moment().subtract(19, 'years')),
        mainContactPhone: "0345 4 10 20 30",
        mainContactAddress: mockAddress(),
        mainContactAddressHistory: {
            currentAddressMeetsMinimum: "yes"
        },
        mainContactCommunicationNeeds: "",
        organisationLegalName: faker.company.companyName(),
        organisationTradingName: faker.company.companyName(),
        organisationType: 'unincorporated-registered-charity',
        organisationStartDate: {
            year: 2017,
            month: 11,
            isBeforeMin: true
        },
        organisationAddress: mockAddress(),
        projectName: faker.lorem.words(5),
        projectBudget: [
            {
                cost: faker.random.number({ min: 100, max: 300 }),
                item: faker.lorem.words(5)
            }
        ],
        projectCountry: faker.random.arrayElement(projectCountries),
        projectLocation: "east-lothian",
        projectLocationDescription: "retr",
        projectPostcode: mockAddress().postcode,
        projectDateRange: {
            endDate: toDateParts(moment().add(30, 'weeks')),
            startDate: toDateParts(moment().add(18, 'weeks'))
        },
        projectTotalCosts: faker.random.number({ min: 301, max: 400 }),
        seniorContactName: {
            lastName: faker.name.lastName(),
            firstName: faker.name.firstName()
        },
        seniorContactEmail: faker.internet.email(),
        seniorContactDateOfBirth: toDateParts(moment().subtract(22, 'years')),
        seniorContactPhone: "0345 4 10 20 30",
        seniorContactAddress: mockAddress(),
        seniorContactAddressHistory: {
            currentAddressMeetsMinimum: "yes"
        },
        seniorContactCommunicationNeeds: "",
        seniorContactRole: "trustee",
        termsPersonPosition: faker.name.jobTitle(),
        termsPersonName: `${faker.name.firstName()} ${faker.name.lastName()}`,
        totalIncomeYear: faker.random.number({ min: 1000, max: 1000000 }),
        yourIdeaCommunity: faker.lorem.words(55),
        yourIdeaPriorities: faker.lorem.words(55),
        yourIdeaProject: faker.lorem.words(55)
    };
};

const prepareSeeds = async () => {
    const user = await Users.createUser({
        username: `${uuidv4()}@example.com`,
        password: faker.internet.password(),
        isActive: true
    });

    return expiryDates.map(expiryDate => {
        return {
            id: uuidv4(),
            userId: user.id,
            formId: 'awards-for-all',
            applicationData: JSON.stringify(generateRandomApplicationData()),
            submissionAttempts: faker.random.number({ min: 0, max: 50 }),
            expiresAt: expiryDate.toDate(),
            createdAt: moment().toDate(),
            updatedAt: moment().toDate()
        };
    });
};

module.exports = {
    prepareSeeds
};
