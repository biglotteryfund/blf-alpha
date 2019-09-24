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
    function randomCountries() {
        const overrideCountries = getOr([], 'projectCountry')(overrides);
        return overrideCountries.length > 0
            ? overrideCountries
            : [sample(['england', 'scotland', 'wales', 'northern-ireland'])];
    }

    const projectCountry = randomCountries();

    const defaults = {
        projectCountry: projectCountry,
        projectLocation: {
            'england': 'derbyshire',
            'scotland': 'east-lothian',
            'wales': 'caerphilly',
            'northern-ireland': 'mid-ulster'
        }[projectCountry],
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
        organisationType: 'Social enterprise',
        organisationBackground: faker.lorem.words(random(50, 500)),
        contactName: {
            firstName: 'Björk',
            lastName: 'Guðmundsdóttir'
        },
        contactEmail: 'general.enquiries@tnlcommunityfund.org.uk',
        contactPhone: '0345 4 10 20 30'
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
        yourIdeaActivities: expect.any(String),
        organisationBackground: expect.any(String)
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

test.each([['yourIdeaProject', 50, 500], ['organisationBackground', 50, 500]])(
    '%p must be within word-count',
    function(fieldName, min, max) {
        const formMin = formBuilder({
            data: mockResponse({
                [fieldName]: faker.lorem.words(min - 1)
            })
        });

        expect(mapMessages(formMin.validation)).toEqual(
            expect.arrayContaining([`Answer must be at least ${min} words`])
        );

        const formMax = formBuilder({
            data: mockResponse({
                [fieldName]: faker.lorem.words(max + 1)
            })
        });

        expect(mapMessages(formMax.validation)).toEqual(
            expect.arrayContaining([`Answer must be no more than ${max} words`])
        );
    }
);

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

test.each([
    'projectLocationDescription',
    'organisationTradingName',
    'contactPhone'
])('optional %p field', function(fieldName) {
    const data = mockResponse();
    const form = formBuilder({ data });

    const expected = omit(data, fieldName);
    const result = form.validate(expected);
    expect(result.error).toBeNull();
});
