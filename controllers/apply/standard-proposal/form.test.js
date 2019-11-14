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
        projectName: 'My project',
        projectCountries: ['england'],
        projectLocation: 'derbyshire',
        projectLocationDescription: 'description',
        projectCosts: '250,000',
        projectDurationYears: 3,
        yourIdeaProject: faker.lorem.words(random(50, 500)),
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
        projectCountries: expect.any(Array),
        projectLocation: expect.any(String),
        yourIdeaProject: expect.any(String),
        yourIdeaCommunity: expect.any(String),
        yourIdeaActivities: expect.any(String)
    });
});

test('invalid form', () => {
    const form = formBuilder();

    const result = form.validate({
        projectCountries: 'invalid-country',
        projectLocation: null,
        projectCosts: 10000,
        projectDurationYears: 10,
        organisationLegalName: 'Same organisation name',
        organisationTradingName: 'Same organisation name'
    });

    expect(mapMessages(result)).toMatchSnapshot();
});

test('strip projectLocation when applying for more than one country', () => {
    const form = formBuilder({
        data: mockResponse({
            projectCountries: ['england', 'scotland'],
            projectLocation: 'this-should-be-stripped'
        })
    });

    expect(form.validation.value).not.toHaveProperty('projectLocation');
});

test('strip projectDurationYears when applying for more than one country', () => {
    const form = formBuilder({
        data: mockResponse({
            projectCountries: ['england', 'scotland'],
            projectDurationYears: 5
        })
    });

    expect(form.validation.value).not.toHaveProperty('projectDurationYears');
});

test('organisation sub-type required for statutory-body', function() {
    const requiredData = mockResponse({ organisationType: 'statutory-body' });
    const requiredResult = formBuilder({ data: requiredData }).validation;

    expect(mapMessages(requiredResult)).toEqual(
        expect.arrayContaining(['Tell us what type of statutory body you are'])
    );

    const validData = mockResponse({
        organisationType: 'statutory-body',
        organisationSubType: 'fire-service'
    });
    const result = formBuilder({ data: validData }).validation;
    expect(result.error).toBeNull();
});

test('language preference required in wales', function() {
    const form = formBuilder({
        data: mockResponse({
            projectCountries: ['england', 'wales']
        })
    });

    expect(mapMessages(form.validation)).toEqual(
        expect.arrayContaining([expect.stringContaining('Select a language')])
    );

    const formValid = formBuilder({
        data: mockResponse({
            projectCountries: ['england', 'wales'],
            contactLanguagePreference: 'welsh'
        })
    });

    expect(formValid.validation.error).toBeNull();

    const formStrip = formBuilder({
        data: mockResponse({
            projectCountries: ['england'],
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

test('projectLocationDescription required if multiple countries selected', function() {
    const form = formBuilder({
        data: mockResponse({
            projectCountries: ['england', 'wales'],
            projectLocationDescription: null
        })
    });

    expect(mapMessages(form.validation)).toEqual(
        expect.arrayContaining([
            expect.stringContaining('Tell us all of the locations')
        ])
    );
});
