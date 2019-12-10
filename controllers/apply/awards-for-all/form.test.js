/* eslint-env jest */
'use strict';
const includes = require('lodash/includes');
const map = require('lodash/map');
const omit = require('lodash/omit');
const sample = require('lodash/sample');
const times = require('lodash/times');
const faker = require('faker');
const moment = require('moment');

const formBuilder = require('./form');

const validateModel = require('../lib/validate-model');

const {
    mockAddress,
    mockBeneficiaries,
    mockBudget,
    mockDateOfBirth,
    mockResponse,
    toDateParts
} = require('./mocks');

function mapMessages(validationResult) {
    return validationResult.messages.map(item => item.msg);
}

function mapMessageSummary(validationResult) {
    return validationResult.messages.map(function(item) {
        return `${item.param}: ${item.msg}`;
    });
}

function mapRawMessages(validationResult) {
    return validationResult.error.details.map(detail => detail.message);
}

function messagesByKey(data) {
    const validationResult = formBuilder({ data }).validation;
    const matches = validationResult.messages.filter(message => {
        return includes(Object.keys(data), message.param);
    });

    return map(matches, 'msg').sort();
}

function assertMessagesByKey(data, messages) {
    expect(messagesByKey(data)).toEqual(messages.sort());
}

function assertValidByKey(data) {
    const validationResult = formBuilder({ data }).validation;
    const messagesByKey = validationResult.messages.filter(message => {
        return includes(Object.keys(data), message.param);
    });

    expect(messagesByKey).toHaveLength(0);
}

function assertInvalidByKey(data) {
    const validationResult = formBuilder({ data }).validation;
    const messagesByKey = validationResult.messages.filter(message => {
        return includes(Object.keys(data), message.param);
    });

    expect(messagesByKey).not.toHaveLength(0);
}

test('validate model shape', () => {
    validateModel(formBuilder());
});

test('empty form', () => {
    const form = formBuilder({ flags: { enableNewDateRange: false } });
    expect(mapMessageSummary(form.validation)).toMatchSnapshot();
    expect(form.progress).toMatchSnapshot();
});

test('valid form for england', () => {
    const data = mockResponse({
        projectCountry: 'england',
        projectLocation: 'derbyshire'
    });

    const form = formBuilder({ data });
    expect(form.validation.error).toBeNull();
});

test('valid form for scotland', () => {
    const data = mockResponse({
        projectCountry: 'scotland',
        projectLocation: 'east-lothian'
    });

    const form = formBuilder({ data });
    expect(form.validation.error).toBeNull();
});

test('valid form for wales', () => {
    const data = mockResponse({
        projectCountry: 'wales',
        projectLocation: 'caerphilly',
        // Additional questions required in Wales
        beneficiariesWelshLanguage: 'all',
        mainContactLanguagePreference: 'welsh',
        seniorContactLanguagePreference: 'welsh'
    });

    const form = formBuilder({ data });
    expect(form.validation.error).toBeNull();

    // Test for existence of country specific fields
    expect(form.getCurrentFields().map(field => field.name)).toEqual(
        expect.arrayContaining([
            'beneficiariesWelshLanguage',
            'mainContactLanguagePreference',
            'seniorContactLanguagePreference'
        ])
    );
});

test('valid form for northern-ireland', () => {
    const data = mockResponse({
        projectCountry: 'northern-ireland',
        projectLocation: 'mid-ulster',
        // Additional questions required in Northern-Ireland
        beneficiariesNorthernIrelandCommunity: 'mainly-catholic'
    });

    const form = formBuilder({ data });
    expect(form.validation.error).toBeNull();

    // Test for existence of country specific fields
    expect(form.getCurrentFields().map(field => field.name)).toEqual(
        expect.arrayContaining(['beneficiariesNorthernIrelandCommunity'])
    );
});

test('valid form for unregistered-vco', function() {
    const data = mockResponse({
        organisationType: 'unregistered-vco',
        seniorContactRole: 'chair'
    });

    const form = formBuilder({ data });
    expect(form.validation.error).toBeNull();
});

test('valid form for unincorporated-registered-charity', function() {
    const data = mockResponse({
        organisationType: 'unincorporated-registered-charity',
        charityNumber: '12345678',
        seniorContactRole: 'trustee'
    });

    const form = formBuilder({ data });
    expect(form.validation.error).toBeNull();
});

test('valid form for charitable-incorporated-organisation', function() {
    const data = mockResponse({
        organisationType: 'charitable-incorporated-organisation',
        charityNumber: '12345678',
        seniorContactRole: 'trustee'
    });

    const form = formBuilder({ data });
    expect(form.validation.error).toBeNull();
});

test('valid form for not-for-profit-company', function() {
    const data = mockResponse({
        organisationType: 'not-for-profit-company',
        companyNumber: '12345678',
        seniorContactRole: 'company-director'
    });

    const form = formBuilder({ data });
    expect(form.validation.error).toBeNull();
});

test('valid form for school', function() {
    const data = mockResponse({
        organisationType: 'school',
        educationNumber: '345678',
        seniorContactRole: 'head-teacher'
    });

    const form = formBuilder({ data });
    expect(form.validation.error).toBeNull();
});

test('valid form for college-or-university', function() {
    const data = mockResponse({
        organisationType: 'college-or-university',
        educationNumber: '345678',
        seniorContactRole: 'chancellor'
    });

    const form = formBuilder({ data });
    expect(form.validation.error).toBeNull();
});

test('valid form for statutory-body', function() {
    const data = mockResponse({
        organisationType: 'statutory-body',
        organisationSubType: 'parish-council',
        seniorContactRole: 'parish-clerk'
    });

    const form = formBuilder({ data });
    expect(form.validation.error).toBeNull();
});

test('valid form for faith-group', function() {
    const data = mockResponse({
        organisationType: 'faith-group',
        seniorContactRole: 'religious-leader'
    });

    const form = formBuilder({ data });
    expect(form.validation.error).toBeNull();
});

test('featured messages based on allow list', () => {
    const data = mockResponse({
        projectDateRange: {
            startDate: { day: 31, month: 1, year: 2019 },
            endDate: { day: 31, month: 1, year: 2019 }
        },
        seniorContactRole: 'not-a-real-role'
    });

    const form = formBuilder({
        data,
        flags: { enableNewDateRange: false }
    });

    const messages = form.validation.featuredMessages.map(item => item.msg);

    expect(messages).toContainEqual(
        expect.stringMatching(/Date you start the project must be after/)
    );

    expect(messages).toContainEqual('Senior contact role is not valid');
});

test('project dates must be within range', () => {
    function validateDateRange(start, end, messages) {
        const data = mockResponse({
            projectDateRange: { startDate: start, endDate: end }
        });

        const form = formBuilder({
            data,
            flags: { enableNewDateRange: false }
        });

        expect(mapMessages(form.validation)).toEqual(
            expect.arrayContaining(messages)
        );
    }

    validateDateRange(null, null, ['Enter a project start and end date']);

    validateDateRange(
        { day: 1, month: 1, year: 2020 },
        { day: 1, month: 1, year: 2021 },
        [expect.stringMatching(/Date you start the project must be after/)]
    );

    validateDateRange(
        toDateParts(moment().add('25', 'weeks')),
        toDateParts(moment().add('2', 'years')),
        [expect.stringMatching(/Date you end the project must be within/)]
    );
});

test('support new project date schema', function() {
    const data = mockResponse({
        projectStartDate: { day: 3, month: 3, year: 2021 },
        projectEndDate: { day: 3, month: 4, year: 2021 }
    });

    const form = formBuilder({
        data: data,
        flags: { enableNewDateRange: true }
    });

    expect(form.validation.error).toBeNull();

    function validateDateRange(start, end, messages) {
        const data = mockResponse({
            projectStartDate: start,
            projectEndDate: end
        });

        const form = formBuilder({
            data,
            flags: { enableNewDateRange: true }
        });

        expect(mapMessages(form.validation)).toEqual(
            expect.arrayContaining(messages)
        );
    }

    validateDateRange(null, null, [
        'Enter a project start date',
        'Enter a project end date'
    ]);

    validateDateRange(
        { day: 1, month: 1, year: 2020 },
        { day: 1, month: 1, year: 2021 },
        [
            expect.stringMatching(
                /Date you start the project must be on or after/
            )
        ]
    );

    validateDateRange(
        toDateParts(moment().add('25', 'weeks')),
        toDateParts(moment().add('2', 'years')),
        [expect.stringMatching(/Date you end the project must be within/)]
    );

    // Maintain backwards compatibility with salesforce schema
    const salesforceResult = form.forSalesforce();
    expect(salesforceResult.projectStartDate).toBe('2021-03-03');
    expect(salesforceResult.projectEndDate).toBe('2021-04-03');
    expect(salesforceResult.projectDateRange).toEqual({
        startDate: '2021-03-03',
        endDate: '2021-04-03'
    });
});

test('project postcode must be a valid UK postcode', () => {
    const data = mockResponse({
        projectPostcode: 'not a postcode'
    });

    const result = formBuilder({ data }).validation;

    expect(mapMessages(result)).toEqual(
        expect.arrayContaining(['Enter a real postcode'])
    );
});

test('project questions must be at least 50 words', function() {
    const data = mockResponse({
        yourIdeaProject: faker.lorem.words(49),
        yourIdeaPriorities: faker.lorem.words(49),
        yourIdeaCommunity: faker.lorem.words(49)
    });

    expect(
        mapMessageSummary(formBuilder({ data }).validation)
    ).toMatchSnapshot();
});

test('project questions must not be over word-count', () => {
    const data = mockResponse({
        yourIdeaProject: faker.lorem.words(301),
        yourIdeaPriorities: faker.lorem.words(151),
        yourIdeaCommunity: faker.lorem.words(201)
    });

    expect(
        mapMessageSummary(formBuilder({ data }).validation)
    ).toMatchSnapshot();
});

test('project costs must be less than £10,000', () => {
    const data = mockResponse({
        projectBudget: times(10, () => ({
            item: faker.lorem.words(5),
            cost: 1100
        }))
    });

    const result = formBuilder({ data }).validation;

    expect(mapMessages(result)).toEqual(
        expect.arrayContaining([
            expect.stringContaining('must be less than £10,000')
        ])
    );
});

test('project total costs must be at least value of project budget', () => {
    const data = mockResponse({
        projectBudget: times(5, () => ({
            item: faker.lorem.words(5),
            cost: 500
        })),
        projectTotalCosts: 1000
    });

    const result = formBuilder({ data }).validation;

    expect(mapMessages(result)).toEqual(
        expect.arrayContaining([
            expect.stringContaining(
                'must be the same as or higher than the amount you’re asking us to fund'
            )
        ])
    );
});

test('require beneficiary groups when check is "yes"', () => {
    assertMessagesByKey(
        {
            beneficiariesGroupsCheck: 'yes',
            beneficiariesGroups: null,
            beneficiariesGroupsOther: null
        },
        [expect.stringContaining('Select the specific group')]
    );
});

test('require additional beneficiary questions based on groups', () => {
    expect(
        messagesByKey({
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
            beneficiariesGroupsOther: null,
            beneficiariesGroupsEthnicBackground: null,
            beneficiariesGroupsGender: null,
            beneficiariesGroupsAge: null,
            beneficiariesGroupsDisabledPeople: null,
            beneficiariesGroupsReligion: null,
            beneficiariesGroupsReligionOther: null
        })
    ).toMatchSnapshot();
});

test('strip beneficiary data when check is "no"', () => {
    assertValidByKey(mockBeneficiaries('no'));
    expect(
        formBuilder({
            data: mockBeneficiaries('no')
        }).validation.value
    ).toEqual({
        beneficiariesGroupsCheck: 'no'
    });
});

test('allow only "other" option for beneficiary groups', () => {
    assertValidByKey(mockBeneficiaries('yes'));

    assertValidByKey({
        beneficiariesGroupsCheck: 'yes',
        beneficiariesGroupsOther: 'this should be valid',
        beneficiariesGroupsEthnicBackground: null,
        beneficiariesGroupsGender: null,
        beneficiariesGroupsAge: null,
        beneficiariesGroupsDisabledPeople: null,
        beneficiariesGroupsReligion: null,
        beneficiariesGroupsReligionOther: null
    });

    assertValidByKey(mockBeneficiaries('yes'));
});

test('valid basic organisation details required', () => {
    const invalidOrganisationData = {
        organisationLegalName: null,
        organisationStartDate: {
            month: 2
        },
        organisationAddress: {
            line1: '3 Embassy Drive',
            county: 'West Midlands',
            postcode: 'B15 1TR'
        },
        organisationType: sample([null, 'not-a-valid-option'])
    };

    expect(messagesByKey(invalidOrganisationData)).toMatchSnapshot();
});

test('finance details required if organisation is over 15 months old', function() {
    const now = moment();
    const requiredDate = now.clone().subtract('15', 'months');

    assertValidByKey({
        organisationStartDate: {
            month: now.month() + 1,
            year: now.year()
        },
        accountingYearDate: null,
        totalIncomeYear: null
    });

    expect(
        messagesByKey({
            organisationStartDate: {
                month: requiredDate.month() + 1,
                year: requiredDate.year()
            },
            accountingYearDate: null,
            totalIncomeYear: null
        })
    ).toMatchSnapshot();

    expect(
        messagesByKey({
            organisationStartDate: {
                month: requiredDate.month() + 1,
                year: requiredDate.year()
            },
            accountingYearDate: {
                month: 22,
                year: 2021
            },
            totalIncomeYear: Infinity
        })
    ).toMatchSnapshot();
});

test.each(['unregistered-vco', 'statutory-body'])(
    'no registration numbers required for %p',
    function(organisationType) {
        assertValidByKey({
            organisationType: organisationType,
            companyNumber: null,
            charityNumber: null,
            educationNumber: null
        });
    }
);

test.each(['not-for-profit-company', 'community-interest-company'])(
    'company number required for %p',
    function(organisationType) {
        assertValidByKey({
            organisationType: organisationType,
            companyNumber: '12345678'
        });

        assertMessagesByKey(
            {
                organisationType: organisationType,
                companyNumber: undefined
            },
            ['Enter your organisation’s Companies House number']
        );
    }
);

test('disallow letter O in charity number for', function() {
    const data = mockResponse({
        organisationType: 'unincorporated-registered-charity',
        charityNumber: 'SCO123'
    });

    const result = formBuilder({ data }).validation;

    expect(mapMessages(result)).toEqual(
        expect.arrayContaining([
            expect.stringContaining(
                'use the number ‘0’ in ‘SC0’ instead of the letter ‘O’'
            )
        ])
    );
});

test.each([
    'unincorporated-registered-charity',
    'charitable-incorporated-organisation'
])('charity number required for %p', function(organisationType) {
    const data = {
        organisationType: organisationType,
        charityNumber: '23456789'
    };

    assertValidByKey(data);

    assertMessagesByKey(
        {
            organisationType: organisationType,
            charityNumber: null
        },
        ['Enter your organisation’s charity number']
    );

    expect(
        formBuilder({
            locale: 'en',
            data: {
                organisationType,
                companyNumber: '12345678',
                charityNumber: '23456789',
                educationNumber: '345678'
            }
        }).validation.value
    ).toEqual(data);
});

test.each(['not-for-profit-company', 'faith-group'])(
    'charity number optional for %p',
    function(organisationType) {
        const data = {
            organisationType: organisationType,
            charityNumber: '23456789'
        };

        assertValidByKey(data);
        assertValidByKey({
            organisationType: organisationType,
            charityNumber: null
        });

        assertValidByKey({
            organisationType: organisationType,
            charityNumber: ''
        });

        const fullNumbers = {
            organisationType,
            charityNumber: '23456789',
            educationNumber: '345678'
        };

        expect(
            formBuilder({
                locale: 'en',
                data: fullNumbers
            }).validation.value
        ).toEqual(data);
    }
);

test.each(['school', 'college-or-university'])(
    'education number required for %p',
    function(organisationType) {
        assertMessagesByKey(
            {
                organisationType: organisationType,
                educationNumber: undefined
            },
            ['Enter your organisation’s Department for Education number']
        );

        assertValidByKey({
            organisationType: organisationType,
            educationNumber: '1160580'
        });
    }
);

test('registration numbers shown based on organisation type', () => {
    const mappings = {
        companyNumber: ['not-for-profit-company', 'community-interest-company'],
        charityNumber: [
            'unincorporated-registered-charity',
            'charitable-incorporated-organisation',
            'not-for-profit-company',
            'faith-group'
        ],
        educationNumber: ['school', 'college-or-university']
    };

    map(mappings, (types, fieldName) => {
        types.forEach(type => {
            const fieldNames = formBuilder({
                locale: 'en',
                data: { organisationType: type }
            })
                .getCurrentFieldsForStep('organisation', 3)
                .map(field => field.name);

            expect(fieldNames).toContain(fieldName);
        });
    });
});

test.each(['seniorContactName', 'mainContactName'])(
    'first and last name must be provided for %p',
    function(fieldName) {
        assertMessagesByKey(
            {
                [fieldName]: {
                    firstName: null,
                    lastName: null
                }
            },
            ['Enter first and last name']
        );
    }
);

test('full names must not match', function() {
    expect(
        messagesByKey({
            seniorContactName: { firstName: 'Ann', lastName: 'Example' },
            mainContactName: { firstName: 'Ann', lastName: 'Example' }
        })
    ).toMatchSnapshot();
});

test('include warning if contact last names match', () => {
    const form = formBuilder();

    expect(form.allFields.mainContactName.warnings).toEqual([]);

    const lastName = faker.name.lastName();
    const formWithMatchingLastNames = formBuilder({
        data: {
            seniorContactName: {
                firstName: faker.name.firstName(),
                lastName: lastName
            },
            mainContactName: {
                firstName: faker.name.firstName(),
                lastName: lastName
            }
        }
    });

    expect(
        formWithMatchingLastNames.allFields.mainContactName.warnings
    ).toEqual([expect.stringContaining('have the same surname')]);
});

test.each(['seniorContactEmail', 'mainContactEmail'])(
    'email address must be valid for %p',
    function(fieldName) {
        assertMessagesByKey(
            {
                [fieldName]: 'not@anemail'
            },
            [
                'Email address must be in the correct format, like name@example.com'
            ]
        );
    }
);

test('email addresses must not match', function() {
    const form = formBuilder({
        data: mockResponse({
            seniorContactEmail: 'example@example.com',
            mainContactEmail: 'Example@example.com' // Test for case insensitivity
        })
    });

    expect(mapMessages(form.validation)).toEqual(
        expect.arrayContaining([
            expect.stringContaining(
                'Main contact email address must be different'
            )
        ])
    );
});

test.each(['seniorContactPhone', 'mainContactPhone'])(
    'phone number must be valid for %p',
    function(fieldName) {
        assertMessagesByKey(
            {
                [fieldName]: 'not a phone number'
            },
            ['Enter a real UK telephone number']
        );
    }
);

test.each([
    ['seniorContactDateOfBirth', 18],
    ['mainContactDateOfBirth', 16]
])(`date of birth must be valid for %p`, function(fieldName, minAge) {
    assertMessagesByKey({ [fieldName]: null }, ['Enter a date of birth']);

    assertMessagesByKey({ [fieldName]: { year: 2000, month: 2, day: 31 } }, [
        'Enter a real date'
    ]);

    assertMessagesByKey({ [fieldName]: mockDateOfBirth(0, minAge - 1) }, [
        `Must be at least ${minAge} years old`
    ]);

    assertValidByKey({
        [fieldName]: mockDateOfBirth(minAge, 90)
    });
});

test('contact address required by default', () => {
    const data = omit(mockResponse(), [
        'mainContactAddress',
        'seniorContactAddress'
    ]);

    const validationResult = formBuilder({ data }).validation;

    expect(mapRawMessages(validationResult)).toEqual([
        '"mainContactAddress" is required',
        '"seniorContactAddress" is required'
    ]);

    expect(mapMessages(validationResult)).toEqual(
        expect.arrayContaining(['Enter a full UK address'])
    );

    expect(validationResult.isValid).toBeFalsy();
});

test.each(['school', 'college-or-university', 'statutory-body'])(
    'dates of birth and addresses stripped for %p',
    function(excludedOrgType) {
        const validForm = formBuilder({
            data: {
                organisationType: excludedOrgType,
                seniorContactDateOfBirth: mockDateOfBirth(18, 90),
                mainContactDateOfBirth: mockDateOfBirth(16, 90),
                seniorContactAddress: mockAddress(),
                seniorContactAddressHistory: {
                    currentAddressMeetsMinimum: 'yes',
                    previousAddress: mockAddress()
                },
                mainContactAddress: mockAddress(),
                mainContactAddressHistory: {
                    currentAddressMeetsMinimum: 'yes',
                    previousAddress: mockAddress()
                }
            }
        });

        // Should strip even when values are invalid
        const invalidForm = formBuilder({
            data: {
                organisationType: excludedOrgType,
                seniorContactDateOfBirth: mockDateOfBirth(1, 17),
                mainContactDateOfBirth: mockDateOfBirth(1, 17),
                seniorContactAddress: {
                    line1: faker.address.streetAddress(),
                    townCity: faker.address.city(),
                    county: faker.address.county()
                },
                mainContactAddress: {
                    line1: faker.address.streetAddress(),
                    townCity: faker.address.city(),
                    county: faker.address.county()
                }
            }
        });

        const expectedData = {
            organisationType: excludedOrgType
        };

        assertValidByKey(expectedData);

        expect(validForm.validation.value).toEqual(expectedData);

        expect(invalidForm.validation.value).toEqual(expectedData);

        // Check fields are not shown
        function checkFieldsForSection(section, expectedFields) {
            const fields = validForm
                .getCurrentFieldsForStep(section, 0)
                .map(field => field.name);

            expect(fields).toEqual(expectedFields);
        }

        checkFieldsForSection('senior-contact', [
            'seniorContactRole',
            'seniorContactName',
            'seniorContactEmail',
            'seniorContactPhone',
            'seniorContactCommunicationNeeds'
        ]);

        checkFieldsForSection('main-contact', [
            'mainContactName',
            'mainContactEmail',
            'mainContactPhone',
            'mainContactCommunicationNeeds'
        ]);
    }
);

test.each(['seniorContactAddress', 'mainContactAddress'])(
    'address is valid for %p',
    function(fieldName) {
        const partialAddress = {
            line1: '3 Embassy Drive',
            county: 'West Midlands',
            postcode: 'B15 1TR'
        };

        const addressWithInvalidPostcode = {
            ...mockAddress(),
            ...{ postcode: 'not a postcode' }
        };

        assertMessagesByKey({ [fieldName]: null }, ['Enter a full UK address']);

        assertMessagesByKey({ [fieldName]: partialAddress }, [
            'Enter a full UK address'
        ]);

        assertMessagesByKey({ [fieldName]: addressWithInvalidPostcode }, [
            'Enter a real postcode'
        ]);
    }
);

test.each(['seniorContactAddressHistory', 'mainContactAddressHistory'])(
    'address history is valid for %p',
    function(fieldName) {
        assertValidByKey({
            [fieldName]: {
                currentAddressMeetsMinimum: 'yes',
                previousAddress: null
            }
        });

        assertValidByKey({
            [fieldName]: {
                currentAddressMeetsMinimum: 'no',
                previousAddress: mockAddress()
            }
        });

        assertMessagesByKey(
            {
                [fieldName]: {
                    currentAddressMeetsMinimum: 'no',
                    previousAddress: {
                        line1: faker.address.streetAddress(),
                        townCity: faker.address.city()
                    }
                }
            },
            ['Enter a full UK address']
        );
    }
);

test('contact addresses must not match', function() {
    expect(
        messagesByKey({
            seniorContactAddress: {
                line1: 'National Lottery Community Fund',
                line2: 'Apex House',
                county: 'West Midlands',
                postcode: 'B15 1TR',
                townCity: 'BIRMINGHAM'
            },
            mainContactAddress: {
                line1: 'National Lottery Community Fund',
                line2: 'Apex House',
                county: 'West Midlands',
                postcode: 'B15 1TR',
                townCity: 'BIRMINGHAM'
            }
        })
    ).toMatchSnapshot();
});
