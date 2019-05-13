'use strict';
const moment = require('moment');
const faker = require('faker');

function toDateParts(dt) {
    return {
        day: dt.date(),
        month: dt.month() + 1,
        year: dt.year()
    };
}

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
        'building-street': faker.address.streetAddress(),
        'town-city': faker.address.city(),
        'county': faker.address.county(),
        'postcode': 'B15 1TR'
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
    country,
    organisationType,
    companyNumber = null,
    charityNumber = null,
    educationNumber = null
}) {
    return {
        'project-name': faker.lorem.words(5),
        'project-country': country,
        'project-start-date': toDateParts(moment().add(12, 'weeks')),
        'project-postcode': 'B15 1TR',
        'your-idea-project': faker.lorem.words(250),
        'your-idea-priorities': faker.lorem.words(100),
        'your-idea-community': faker.lorem.words(150),
        'project-budget': mockBudget(),
        'project-total-costs': faker.random.number({ min: 5000, max: 10000 }),
        'beneficiaries-location-check': 'yes',
        'beneficiaries-local-authority': 'Wigan',
        'beneficiaries-location-description': faker.lorem.sentence(),
        'beneficiaries-groups-check': 'no',
        'beneficiaries-groups': [],
        'organisation-legal-name': faker.company.companyName(),
        'organisation-address': mockAddress(),
        'organisation-type': organisationType,
        'company-number': companyNumber,
        'charity-number': charityNumber,
        'education-number': educationNumber,
        'accounting-year-date': { day: 1, month: 3 },
        'total-income-year': faker.random.number({ min: 10000, max: 1000000 }),
        'main-contact-first-name': faker.name.firstName(),
        'main-contact-last-name': faker.name.lastName(),
        'main-contact-dob': mockDateOfBirth(16),
        'main-contact-address': mockAddress(),
        'main-contact-address-history': {
            'current-address-meets-minimum': 'no',
            'previous-address': mockAddress()
        },
        'main-contact-email': faker.internet.exampleEmail(),
        'main-contact-phone': '0345 4 10 20 30',
        'senior-contact-first-name': faker.name.firstName(),
        'senior-contact-last-name': faker.name.lastName(),
        'senior-contact-role': faker.lorem.words(5),
        'senior-contact-dob': mockDateOfBirth(18),
        'senior-contact-address': mockAddress(),
        'senior-contact-address-history': {
            'current-address-meets-minimum': 'yes'
        },
        'senior-contact-email': faker.internet.exampleEmail(),
        'senior-contact-phone': '020 7211 1888',
        'bank-account-name': faker.company.companyName(),
        'bank-sort-code': '108800',
        'bank-account-number': '00012345',
        'bank-building-society-number': '108800',
        'bank-statement': faker.system.fileName()
    };
}

module.exports = {
    mockAddress,
    mockBudget,
    mockDateOfBirth,
    mockFullForm,
    mockStartDate
};
