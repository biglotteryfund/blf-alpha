/* eslint-env jest */
'use strict';
const getOr = require('lodash/fp/getOr');
const omit = require('lodash/omit');
const random = require('lodash/random');
const sample = require('lodash/sample');
const faker = require('faker');

const formBuilder = require('./form');

function mapMessages(validationResult) {
    return validationResult.messages.map(detail => detail.msg);
}

function mapRawMessages(validationResult) {
    return validationResult.error.details.map(detail => {
        return detail.message;
    });
}

function mockResponse(overrides = {}) {
    const defaults = {
        projectCountry: ['england'],
        projectLocation: 'derbyshire',
        projectLocationDescription: 'optional description',
        projectCosts: '250,000',
        projectDurationYears: 3,
        yourIdeaProject: faker.lorem.words(random(50, 500)),
        yourIdeaCommunity: faker.lorem.words(random(50, 500)),
        yourIdeaActivities: faker.lorem.words(random(50, 500)),
        organisationLegalName: 'Example organisation',
        organisationTradingName: 'Example trading name',
        organisationAddress: {
            line1: '1234 example street',
            townCity: 'Birmingham',
            county: 'West Midlands',
            postcode: 'B15 1TR'
        },
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

test('minimal valid form', () => {
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

test('minimal invalid form', () => {
    const form = formBuilder();

    const result = form.validate({
        projectCountry: 'invalid-country',
        projectLocation: null,
        projectCosts: 5000,
        projectDurationYears: 10
    });

    expect(mapMessages(result)).toMatchSnapshot();

    expect(mapRawMessages(result)).toMatchSnapshot();
});

test('strip location and duration when applying for more than one country', () => {
    const form = formBuilder({
        data: mockResponse({
            projectCountry: ['england', 'scotland'],
            projectLocation: 'this-should-be-stripped',
            projectDurationYears: 5
        })
    });

    expect(form.validation.value).not.toHaveProperty('projectLocation');
    expect(form.validation.value).not.toHaveProperty('projectDurationYears');
});

test('project duration is between limits', () => {
    const formMin = formBuilder({
        data: mockResponse({
            projectCountry: ['scotland'],
            projectDurationYears: 0
        })
    });

    expect(mapRawMessages(formMin.validation)).toEqual(
        expect.arrayContaining([
            `"projectDurationYears" must be larger than or equal to 1`
        ])
    );

    const formMax = formBuilder({
        data: mockResponse({
            projectCountry: ['wales'],
            projectDurationYears: 6
        })
    });

    expect(mapRawMessages(formMax.validation)).toEqual(
        expect.arrayContaining([
            `"projectDurationYears" must be less than or equal to 5`
        ])
    );
});

test('project costs must be at least 10,000', function() {
    const form = formBuilder({
        data: mockResponse({
            projectCosts: '5,500'
        })
    });

    expect(mapMessages(form.validation)).toEqual(
        expect.arrayContaining([
            expect.stringContaining(
                'If you need £10,000 or less from us, you can apply today through'
            )
        ])
    );
});

test('language prefrence required in wales', function() {
    const form = formBuilder({
        data: mockResponse({
            projectCountry: ['wales'],
            projectLocation: 'swansea'
        })
    });

    expect(mapMessages(form.validation)).toEqual(
        expect.arrayContaining([expect.stringContaining('Select a language')])
    );

    const formValid = formBuilder({
        data: mockResponse({
            projectCountry: ['wales'],
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
