/* eslint-env jest */
'use strict';
const omit = require('lodash/omit');
const random = require('lodash/random');
const faker = require('faker');

const formBuilder = require('./form');

function mapMessages(validationResult) {
    return validationResult.messages.map(detail => detail.msg);
}

function mockResponse(overrides = {}) {
    const defaults = {
        projectCountry: ['england'],
        projectLocation: 'derbyshire',
        projectLocationDescription: 'optional description',
        projectCosts: '250,000',
        projectDurationYears: 3,
        yourIdeaProject: faker.lorem.words(random(50, 250)),
        yourIdeaCommunity: faker.lorem.words(random(50, 500)),
        yourIdeaActivities: faker.lorem.words(random(50, 350)),
        organisationLegalName: 'Example organisation',
        organisationTradingName: 'Example trading name',
        organisationAddress: {
            line1: '1234 example street',
            townCity: 'Birmingham',
            county: 'West Midlands',
            postcode: 'B15 1TR'
        },
        organisationType: 'not-for-profit-company',
        contactName: {
            firstName: 'Björk',
            lastName: 'Guðmundsdóttir'
        },
        contactEmail: 'general.enquiries@tnlcommunityfund.org.uk',
        contactPhone: '0345 4 10 20 30',
        contactCommunicationNeeds: 'Large print'
    };

    return Object.assign(defaults, overrides);
}

test('valid form', () => {
    const data = mockResponse();
    const result = formBuilder({ data }).validation;
    expect(result.error).toBeNull();

    expect(result.value).toMatchSnapshot({
        projectCountry: expect.any(Array),
        projectLocation: expect.any(String),
        yourIdeaProject: expect.any(String),
        yourIdeaCommunity: expect.any(String),
        yourIdeaActivities: expect.any(String)
    });
});

test('invalid form', () => {
    const form = formBuilder();

    const result = form.validate({
        projectCountry: 'invalid-country',
        projectLocation: null,
        projectCosts: 5000,
        projectDurationYears: 10,
        organisationLegalName: 'Same organisation name',
        organisationTradingName: 'Same organisation name'
    });

    expect(mapMessages(result)).toMatchSnapshot();
});

test('strip projectLocation when applying for more than one country', () => {
    const form = formBuilder({
        data: mockResponse({
            projectCountry: ['england', 'scotland'],
            projectLocation: 'this-should-be-stripped'
        })
    });

    expect(form.validation.value).not.toHaveProperty('projectLocation');
});

test('strip projectDurationYears when applying for more than one country', () => {
    const form = formBuilder({
        data: mockResponse({
            projectCountry: ['england', 'scotland'],
            projectDurationYears: 5
        })
    });

    expect(form.validation.value).not.toHaveProperty('projectDurationYears');
});

test('language preference required in wales', function() {
    const form = formBuilder({
        data: mockResponse({
            projectCountry: ['england', 'wales'],
            projectLocation: 'swansea'
        })
    });

    expect(mapMessages(form.validation)).toEqual(
        expect.arrayContaining([expect.stringContaining('Select a language')])
    );

    const formValid = formBuilder({
        data: mockResponse({
            projectCountry: ['england', 'wales'],
            projectLocation: 'swansea',
            contactLanguagePreference: 'welsh'
        })
    });

    expect(formValid.validation.error).toBeNull();

    const formStrip = formBuilder({
        data: mockResponse({
            projectCountry: ['england'],
            contactLanguagePreference: 'welsh'
        })
    });

    expect(formStrip.validation.value).not.toHaveProperty(
        'contactLanguagePreference'
    );
});

test.each([
    'projectLocationDescription',
    'organisationTradingName',
    'contactPhone',
    'contactCommunicationNeeds'
])('optional %p field', function(fieldName) {
    const data = mockResponse();
    const form = formBuilder({ data });

    const expected = omit(data, fieldName);
    const result = form.validate(expected);
    expect(result.error).toBeNull();
});
