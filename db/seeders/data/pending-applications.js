'use strict';
const faker = require('faker');
const moment = require('moment');
const uuidv4 = require('uuid/v4');

const projectCountries = ['scotland', 'wales', 'england', 'northern-ireland'];
const orgTypes = [
    'unregistered-vco',
    'unincorporated-registered-charity',
    'charitable-incorporated-organisation',
    'not-for-profit-company',
    'school',
    'college-or-university',
    'statutory-body',
    'faith-group'
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

module.exports = {
    data: [
        {
            id: uuidv4(),
            userId: 1,
            formId: "awards-for-all",
            applicationData: JSON.stringify({
                projectName: faker.lorem.words(5),
                bankSortCode: faker.finance.account(6),
                bankStatement: {
                    size: 123,
                    type: "application/pdf",
                    filename: "example.pdf"
                },
                charityNumber: faker.finance.account(7),
                projectBudget: [
                    {
                        cost: faker.random.number({ min: 100, max: 300 }),
                        item: faker.lorem.words(5)
                    }
                ],
                projectCountry: faker.random.arrayElement(projectCountries),
                bankAccountName: faker.finance.accountName(),
                mainContactName: {
                    lastName: faker.name.lastName(),
                    firstName: faker.name.firstName()
                },
                projectLocation: "east-lothian",
                projectPostcode: mockAddress().postcode,
                termsPersonName: `${faker.name.firstName()} ${faker.name.lastName()}`,
                totalIncomeYear: faker.random.number({ min: 1000, max: 1000000 }),
                yourIdeaProject: faker.lorem.words(55),
                mainContactEmail: faker.internet.email(),
                mainContactPhone: "0345 4 10 20 30",
                organisationType: faker.random.arrayElement(orgTypes),
                projectDateRange: {
                    endDate: toDateParts(moment().add(30, 'weeks')),
                    startDate: toDateParts(moment().add(18, 'weeks'))
                },
                bankAccountNumber: faker.finance.account(),
                projectTotalCosts: faker.random.number({ min: 301, max: 400 }),
                seniorContactName: {
                    lastName: faker.name.lastName(),
                    firstName: faker.name.firstName()
                },
                seniorContactRole: "trustee",
                yourIdeaCommunity: faker.lorem.words(55),
                accountingYearDate: {
                    day: faker.random.number({ min: 1, max: 28 }),
                    month: faker.random.number({ min: 1, max: 12 })
                },
                mainContactAddress: mockAddress(),
                seniorContactEmail: faker.internet.email(),
                seniorContactPhone: "0345 4 10 20 30",
                yourIdeaPriorities: faker.lorem.words(55),
                organisationAddress: mockAddress(),
                termsPersonPosition: faker.name.jobTitle(),
                seniorContactAddress: mockAddress(),
                buildingSocietyNumber: faker.random.alphaNumeric(8),
                organisationLegalName: faker.company.companyName(),
                organisationStartDate: {
                    year: 2017,
                    month: 11,
                    isBeforeMin: true
                },
                mainContactDateOfBirth: toDateParts(moment().subtract(19, 'years')),
                organisationTradingName: faker.company.companyName(),
                beneficiariesGroupsCheck: 'no',
                seniorContactDateOfBirth: toDateParts(moment().subtract(22, 'years')),
                mainContactAddressHistory: {
                    currentAddressMeetsMinimum: "yes"
                },
                projectLocationDescription: "retr",
                seniorContactAddressHistory: {
                    currentAddressMeetsMinimum: "yes"
                },
                mainContactCommunicationNeeds: "",
                seniorContactCommunicationNeeds: "",
                beneficiariesGroupsReligionOther: ""
            }),
            submissionAttempts: faker.random.number({ min: 0, max: 50 }),
            expiresAt: moment().add('30', 'days').toDate(),
            createdAt: moment().toDate(),
            updatedAt: moment().toDate()
        },
        {
            id: uuidv4(),
            userId: 1,
            formId: "awards-for-all",
            applicationData: JSON.stringify({
                projectName: faker.lorem.words(5),
                bankSortCode: faker.finance.account(6),
                bankStatement: {
                    size: 123,
                    type: "application/pdf",
                    filename: "example.pdf"
                },
                charityNumber: faker.finance.account(7),
                projectBudget: [
                    {
                        cost: faker.random.number({ min: 100, max: 300 }),
                        item: faker.lorem.words(5)
                    }
                ],
                projectCountry: faker.random.arrayElement(projectCountries),
                bankAccountName: faker.finance.accountName(),
                mainContactName: {
                    lastName: faker.name.lastName(),
                    firstName: faker.name.firstName()
                },
                projectLocation: "east-lothian",
                projectPostcode: mockAddress().postcode,
                termsPersonName: `${faker.name.firstName()} ${faker.name.lastName()}`,
                totalIncomeYear: faker.random.number({ min: 1000, max: 1000000 }),
                yourIdeaProject: faker.lorem.words(55),
                mainContactEmail: faker.internet.email(),
                mainContactPhone: "0345 4 10 20 30",
                organisationType: faker.random.arrayElement(orgTypes),
                projectDateRange: {
                    endDate: toDateParts(moment().add(30, 'weeks')),
                    startDate: toDateParts(moment().add(18, 'weeks'))
                },
                bankAccountNumber: faker.finance.account(),
                projectTotalCosts: faker.random.number({ min: 301, max: 400 }),
                seniorContactName: {
                    lastName: faker.name.lastName(),
                    firstName: faker.name.firstName()
                },
                seniorContactRole: "trustee",
                yourIdeaCommunity: faker.lorem.words(55),
                accountingYearDate: {
                    day: faker.random.number({ min: 1, max: 28 }),
                    month: faker.random.number({ min: 1, max: 12 })
                },
                mainContactAddress: mockAddress(),
                seniorContactEmail: faker.internet.email(),
                seniorContactPhone: "0345 4 10 20 30",
                yourIdeaPriorities: faker.lorem.words(55),
                organisationAddress: mockAddress(),
                termsPersonPosition: faker.name.jobTitle(),
                seniorContactAddress: mockAddress(),
                buildingSocietyNumber: faker.random.alphaNumeric(8),
                organisationLegalName: faker.company.companyName(),
                organisationStartDate: {
                    year: 2017,
                    month: 11,
                    isBeforeMin: true
                },
                mainContactDateOfBirth: toDateParts(moment().subtract(19, 'years')),
                organisationTradingName: faker.company.companyName(),
                beneficiariesGroupsCheck: 'no',
                seniorContactDateOfBirth: toDateParts(moment().subtract(22, 'years')),
                mainContactAddressHistory: {
                    currentAddressMeetsMinimum: "yes"
                },
                projectLocationDescription: "retr",
                seniorContactAddressHistory: {
                    currentAddressMeetsMinimum: "yes"
                },
                mainContactCommunicationNeeds: "",
                seniorContactCommunicationNeeds: "",
                beneficiariesGroupsReligionOther: ""
            }),
            submissionAttempts: faker.random.number({ min: 0, max: 50 }),
            expiresAt: moment().add('14', 'days').toDate(),
            createdAt: moment().toDate(),
            updatedAt: moment().toDate()
        },
        {
            id: uuidv4(),
            userId: 1,
            formId: "awards-for-all",
            applicationData: JSON.stringify({
                projectName: faker.lorem.words(5),
                bankSortCode: faker.finance.account(6),
                bankStatement: {
                    size: 123,
                    type: "application/pdf",
                    filename: "example.pdf"
                },
                charityNumber: faker.finance.account(7),
                projectBudget: [
                    {
                        cost: faker.random.number({ min: 100, max: 300 }),
                        item: faker.lorem.words(5)
                    }
                ],
                projectCountry: faker.random.arrayElement(projectCountries),
                bankAccountName: faker.finance.accountName(),
                mainContactName: {
                    lastName: faker.name.lastName(),
                    firstName: faker.name.firstName()
                },
                projectLocation: "east-lothian",
                projectPostcode: mockAddress().postcode,
                termsPersonName: `${faker.name.firstName()} ${faker.name.lastName()}`,
                totalIncomeYear: faker.random.number({ min: 1000, max: 1000000 }),
                yourIdeaProject: faker.lorem.words(55),
                mainContactEmail: faker.internet.email(),
                mainContactPhone: "0345 4 10 20 30",
                organisationType: faker.random.arrayElement(orgTypes),
                projectDateRange: {
                    endDate: toDateParts(moment().add(30, 'weeks')),
                    startDate: toDateParts(moment().add(18, 'weeks'))
                },
                bankAccountNumber: faker.finance.account(),
                projectTotalCosts: faker.random.number({ min: 301, max: 400 }),
                seniorContactName: {
                    lastName: faker.name.lastName(),
                    firstName: faker.name.firstName()
                },
                seniorContactRole: "trustee",
                yourIdeaCommunity: faker.lorem.words(55),
                accountingYearDate: {
                    day: faker.random.number({ min: 1, max: 28 }),
                    month: faker.random.number({ min: 1, max: 12 })
                },
                mainContactAddress: mockAddress(),
                seniorContactEmail: faker.internet.email(),
                seniorContactPhone: "0345 4 10 20 30",
                yourIdeaPriorities: faker.lorem.words(55),
                organisationAddress: mockAddress(),
                termsPersonPosition: faker.name.jobTitle(),
                seniorContactAddress: mockAddress(),
                buildingSocietyNumber: faker.random.alphaNumeric(8),
                organisationLegalName: faker.company.companyName(),
                organisationStartDate: {
                    year: 2017,
                    month: 11,
                    isBeforeMin: true
                },
                mainContactDateOfBirth: toDateParts(moment().subtract(19, 'years')),
                organisationTradingName: faker.company.companyName(),
                beneficiariesGroupsCheck: 'no',
                seniorContactDateOfBirth: toDateParts(moment().subtract(22, 'years')),
                mainContactAddressHistory: {
                    currentAddressMeetsMinimum: "yes"
                },
                projectLocationDescription: "retr",
                seniorContactAddressHistory: {
                    currentAddressMeetsMinimum: "yes"
                },
                mainContactCommunicationNeeds: "",
                seniorContactCommunicationNeeds: "",
                beneficiariesGroupsReligionOther: ""
            }),
            submissionAttempts: faker.random.number({ min: 0, max: 50 }),
            expiresAt: moment().add('2', 'days').toDate(),
            createdAt: moment().toDate(),
            updatedAt: moment().toDate()
        },
        {
            id: uuidv4(),
            userId: 1,
            formId: "awards-for-all",
            applicationData: JSON.stringify({
                projectName: faker.lorem.words(5),
                bankSortCode: faker.finance.account(6),
                bankStatement: {
                    size: 123,
                    type: "application/pdf",
                    filename: "example.pdf"
                },
                charityNumber: faker.finance.account(7),
                projectBudget: [
                    {
                        cost: faker.random.number({ min: 100, max: 300 }),
                        item: faker.lorem.words(5)
                    }
                ],
                projectCountry: faker.random.arrayElement(projectCountries),
                bankAccountName: faker.finance.accountName(),
                mainContactName: {
                    lastName: faker.name.lastName(),
                    firstName: faker.name.firstName()
                },
                projectLocation: "east-lothian",
                projectPostcode: mockAddress().postcode,
                termsPersonName: `${faker.name.firstName()} ${faker.name.lastName()}`,
                totalIncomeYear: faker.random.number({ min: 1000, max: 1000000 }),
                yourIdeaProject: faker.lorem.words(55),
                mainContactEmail: faker.internet.email(),
                mainContactPhone: "0345 4 10 20 30",
                organisationType: faker.random.arrayElement(orgTypes),
                projectDateRange: {
                    endDate: toDateParts(moment().add(30, 'weeks')),
                    startDate: toDateParts(moment().add(18, 'weeks'))
                },
                bankAccountNumber: faker.finance.account(),
                projectTotalCosts: faker.random.number({ min: 301, max: 400 }),
                seniorContactName: {
                    lastName: faker.name.lastName(),
                    firstName: faker.name.firstName()
                },
                seniorContactRole: "trustee",
                yourIdeaCommunity: faker.lorem.words(55),
                accountingYearDate: {
                    day: faker.random.number({ min: 1, max: 28 }),
                    month: faker.random.number({ min: 1, max: 12 })
                },
                mainContactAddress: mockAddress(),
                seniorContactEmail: faker.internet.email(),
                seniorContactPhone: "0345 4 10 20 30",
                yourIdeaPriorities: faker.lorem.words(55),
                organisationAddress: mockAddress(),
                termsPersonPosition: faker.name.jobTitle(),
                seniorContactAddress: mockAddress(),
                buildingSocietyNumber: faker.random.alphaNumeric(8),
                organisationLegalName: faker.company.companyName(),
                organisationStartDate: {
                    year: 2017,
                    month: 11,
                    isBeforeMin: true
                },
                mainContactDateOfBirth: toDateParts(moment().subtract(19, 'years')),
                organisationTradingName: faker.company.companyName(),
                beneficiariesGroupsCheck: 'no',
                seniorContactDateOfBirth: toDateParts(moment().subtract(22, 'years')),
                mainContactAddressHistory: {
                    currentAddressMeetsMinimum: "yes"
                },
                projectLocationDescription: "retr",
                seniorContactAddressHistory: {
                    currentAddressMeetsMinimum: "yes"
                },
                mainContactCommunicationNeeds: "",
                seniorContactCommunicationNeeds: "",
                beneficiariesGroupsReligionOther: ""
            }),
            submissionAttempts: faker.random.number({ min: 0, max: 50 }),
            expiresAt: moment().toDate(),
            createdAt: moment().toDate(),
            updatedAt: moment().toDate()
        },
        {
            id: uuidv4(),
            userId: 1,
            formId: "awards-for-all",
            applicationData: JSON.stringify({
                projectName: faker.lorem.words(5),
                bankSortCode: faker.finance.account(6),
                bankStatement: {
                    size: 123,
                    type: "application/pdf",
                    filename: "example.pdf"
                },
                charityNumber: faker.finance.account(7),
                projectBudget: [
                    {
                        cost: faker.random.number({ min: 100, max: 300 }),
                        item: faker.lorem.words(5)
                    }
                ],
                projectCountry: faker.random.arrayElement(projectCountries),
                bankAccountName: faker.finance.accountName(),
                mainContactName: {
                    lastName: faker.name.lastName(),
                    firstName: faker.name.firstName()
                },
                projectLocation: "east-lothian",
                projectPostcode: mockAddress().postcode,
                termsPersonName: `${faker.name.firstName()} ${faker.name.lastName()}`,
                totalIncomeYear: faker.random.number({ min: 1000, max: 1000000 }),
                yourIdeaProject: faker.lorem.words(55),
                mainContactEmail: faker.internet.email(),
                mainContactPhone: "0345 4 10 20 30",
                organisationType: faker.random.arrayElement(orgTypes),
                projectDateRange: {
                    endDate: toDateParts(moment().add(30, 'weeks')),
                    startDate: toDateParts(moment().add(18, 'weeks'))
                },
                bankAccountNumber: faker.finance.account(),
                projectTotalCosts: faker.random.number({ min: 301, max: 400 }),
                seniorContactName: {
                    lastName: faker.name.lastName(),
                    firstName: faker.name.firstName()
                },
                seniorContactRole: "trustee",
                yourIdeaCommunity: faker.lorem.words(55),
                accountingYearDate: {
                    day: faker.random.number({ min: 1, max: 28 }),
                    month: faker.random.number({ min: 1, max: 12 })
                },
                mainContactAddress: mockAddress(),
                seniorContactEmail: faker.internet.email(),
                seniorContactPhone: "0345 4 10 20 30",
                yourIdeaPriorities: faker.lorem.words(55),
                organisationAddress: mockAddress(),
                termsPersonPosition: faker.name.jobTitle(),
                seniorContactAddress: mockAddress(),
                buildingSocietyNumber: faker.random.alphaNumeric(8),
                organisationLegalName: faker.company.companyName(),
                organisationStartDate: {
                    year: 2017,
                    month: 11,
                    isBeforeMin: true
                },
                mainContactDateOfBirth: toDateParts(moment().subtract(19, 'years')),
                organisationTradingName: faker.company.companyName(),
                beneficiariesGroupsCheck: 'no',
                seniorContactDateOfBirth: toDateParts(moment().subtract(22, 'years')),
                mainContactAddressHistory: {
                    currentAddressMeetsMinimum: "yes"
                },
                projectLocationDescription: "retr",
                seniorContactAddressHistory: {
                    currentAddressMeetsMinimum: "yes"
                },
                mainContactCommunicationNeeds: "",
                seniorContactCommunicationNeeds: "",
                beneficiariesGroupsReligionOther: ""
            }),
            submissionAttempts: faker.random.number({ min: 0, max: 50 }),
            expiresAt: moment().subtract('5', 'days').toDate(),
            createdAt: moment().toDate(),
            updatedAt: moment().toDate()
        }
    ]
};
