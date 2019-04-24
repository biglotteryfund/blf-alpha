'use strict';
const faker = require('faker');
const moment = require('moment');

function toDateParts(dt) {
    return {
        day: dt.date(),
        month: dt.month() + 1,
        year: dt.year()
    };
}

function mockDateOfBirth() {
    return toDateParts(
        moment().subtract(
            faker.random.number({
                min: 18,
                max: 75
            }),
            'years'
        )
    );
}

function mockAddress() {
    return {
        'building-street': faker.address.streetAddress(),
        'town-city': faker.address.city(),
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

function mockFullForm({ country, organisationType, companyNumber = null, charityNumber = null }) {
    return {
        'application-title': faker.lorem.words(5),
        'application-country': country,
        'project-start-date': toDateParts(moment().add(12, 'weeks')),
        'project-postcode': 'B15 1TR',
        'your-idea-project': faker.lorem.words(250),
        'your-idea-priorities': faker.lorem.words(100),
        'your-idea-community': faker.lorem.words(150),
        'project-budget': mockBudget(),
        'project-total-costs': faker.random.number({ min: 5000, max: 10000 }),
        'organisation-legal-name': faker.company.companyName(),
        'organisation-address': mockAddress(),
        'organisation-type': organisationType,
        'company-number': companyNumber,
        'charity-number': charityNumber,
        'accounting-year-date': { day: 1, month: 3 },
        'total-income-year': faker.random.number({ min: 10000, max: 1000000 }),
        'main-contact-first-name': faker.name.firstName(),
        'main-contact-last-name': faker.name.lastName(),
        'main-contact-dob': mockDateOfBirth(),
        'main-contact-address': mockAddress(),
        'main-contact-email': faker.internet.exampleEmail(),
        'main-contact-phone': '0345 4 10 20 30',
        'legal-contact-first-name': faker.name.firstName(),
        'legal-contact-last-name': faker.name.lastName(),
        'legal-contact-role': faker.lorem.words(5),
        'legal-contact-dob': mockDateOfBirth(),
        'legal-contact-address': mockAddress(),
        'legal-contact-email': faker.internet.exampleEmail(),
        'legal-contact-phone': '020 7211 1888',
        'bank-account-name': faker.company.companyName(),
        'bank-sort-code': '108800',
        'bank-account-number': '00012345',
        'bank-building-society-number': '108800',
        'bank-statement': faker.system.fileName()
    };
}

module.exports = {
    mockDateOfBirth,
    mockAddress,
    mockBudget,
    mockFullForm
};
