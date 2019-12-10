/* eslint-env jest */
'use strict';
const concat = require('lodash/concat');
const difference = require('lodash/difference');
const includes = require('lodash/includes');
const map = require('lodash/map');
const omit = require('lodash/omit');
const sample = require('lodash/sample');
const times = require('lodash/times');
const faker = require('faker');
const moment = require('moment');

const formBuilder = require('./form');
const {
    BENEFICIARY_GROUPS,
    ORGANISATION_TYPES,
    CONTACT_EXCLUDED_TYPES,
    COMPANY_NUMBER_TYPES,
    CHARITY_NUMBER_TYPES,
    EDUCATION_NUMBER_TYPES
} = require('./constants');

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

test.each(
    Object.entries({
        'unregistered-vco': {
            seniorContactRole: 'chair'
        },
        'unincorporated-registered-charity': {
            charityNumber: '12345678',
            seniorContactRole: 'trustee'
        },
        'charitable-incorporated-organisation': {
            charityNumber: '12345678',
            seniorContactRole: 'trustee'
        },
        'not-for-profit-company': {
            companyNumber: '12345678',
            seniorContactRole: 'company-director'
        },
        'school': {
            educationNumber: '345678',
            seniorContactRole: 'head-teacher'
        },
        'college-or-university': {
            educationNumber: '345678',
            seniorContactRole: 'chancellor'
        },
        'statutory-body': {
            organisationSubType: 'parish-council',
            seniorContactRole: 'parish-clerk'
        },
        'faith-group': {
            seniorContactRole: 'religious-leader'
        }
    })
)('valid form for %s', function(organisationType, data) {
    const form = formBuilder({
        data: mockResponse({
            organisationType: organisationType,
            organisationSubType: data.organisationSubType,
            companyNumber: data.companyNumber,
            charityNumber: data.charityNumber,
            educationNumber: data.educationNumber,
            seniorContactRole: data.seniorContactRole
        })
    });

    expect(form.validation.isValid).toBeTruthy();
    expect(form.validation.messages).toHaveLength(0);

    expect(form.progress.isComplete).toBeTruthy();
    expect(form.progress.isPristine).toBeFalsy();

    const allSectionsComplete = form.progress.sections.every(
        section => section.status === 'complete'
    );
    expect(allSectionsComplete).toBeTruthy();
});

test('featured messages based on allow list', () => {
    const form = formBuilder({
        data: {
            projectDateRange: {
                startDate: { day: 31, month: 1, year: 2019 },
                endDate: { day: 31, month: 1, year: 2019 }
            },
            seniorContactRole: 'not-a-real-role'
        },
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

describe('Project details', () => {
    test('project postcode must be a valid UK postcode', () => {
        const invalidMessages = ['Enter a real postcode'];
        assertMessagesByKey(
            {
                projectCountry: 'scotland',
                projectPostcode: null
            },
            invalidMessages
        );
        assertMessagesByKey(
            {
                projectCountry: 'scotland',
                projectPostcode: 'not a postcode'
            },
            invalidMessages
        );
    });

    test.each([
        ['yourIdeaProject', 50, 300],
        ['yourIdeaPriorities', 50, 150],
        ['yourIdeaCommunity', 50, 200]
    ])('%p must be within %p and %p words', (fieldName, min, max) => {
        assertMessagesByKey({ [fieldName]: faker.lorem.words(min - 1) }, [
            expect.stringMatching(/Answer must be at least/)
        ]);

        assertMessagesByKey({ [fieldName]: faker.lorem.words(max + 1) }, [
            expect.stringMatching(/Answer must be no more than/)
        ]);
    });
});

describe('Project budget', () => {
    function value(budget, totalCosts = 20000) {
        return { projectBudget: budget, projectTotalCosts: totalCosts };
    }

    test('must provide a valid budget', () => {
        assertValidByKey(value(mockBudget()));

        const defaultMessages = ['Enter a project budget'];
        const tooSmallMessage = ['Enter at least one item'];
        assertMessagesByKey(value([]), tooSmallMessage);

        const budgetWithoutCosts = times(5, () => ({
            item: faker.lorem.words(5)
        }));

        assertMessagesByKey(value(budgetWithoutCosts), defaultMessages);
    });

    test('project costs must be less than £10,000', () => {
        const budget = times(10, () => ({
            item: faker.lorem.words(5),
            cost: 1100
        }));

        assertMessagesByKey(value(budget), [
            'Costs you would like us to fund must be less than £10,000'
        ]);
    });

    test('project total costs must be at least value of project budget', () => {
        assertValidByKey(value(mockBudget()));

        assertMessagesByKey(value(mockBudget(), null), [
            'Enter a total cost for your project'
        ]);
        assertMessagesByKey(value(mockBudget(), Infinity), [
            'Enter a total cost for your project'
        ]);
        assertMessagesByKey(value(mockBudget(), 1000), [
            'Total cost must be the same as or higher than the amount you’re asking us to fund'
        ]);
    });
});

describe('Who will benefit', () => {
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
                beneficiariesGroups: Object.values(BENEFICIARY_GROUPS),
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
});

describe('Your organisation', () => {
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
});
describe('Registration numbers', function() {
    const noRegistrationNumbers = difference(
        Object.values(ORGANISATION_TYPES),
        concat(
            COMPANY_NUMBER_TYPES,
            CHARITY_NUMBER_TYPES.required,
            CHARITY_NUMBER_TYPES.optional,
            EDUCATION_NUMBER_TYPES
        )
    );

    test.each(noRegistrationNumbers)(
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

    test.each(COMPANY_NUMBER_TYPES)('company number required for %p', function(
        organisationType
    ) {
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
    });

    test.each(
        concat(CHARITY_NUMBER_TYPES.required, CHARITY_NUMBER_TYPES.optional)
    )('Disallow letter O in charity number for %p', function(organisationType) {
        assertInvalidByKey({
            organisationType: organisationType,
            charityNumber: 'SCO123'
        });

        assertInvalidByKey({
            organisationType: organisationType,
            charityNumber: 'SCo123'
        });
    });

    test.each(CHARITY_NUMBER_TYPES.required)(
        'charity number required for %p',
        function(organisationType) {
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
        }
    );

    test.each(CHARITY_NUMBER_TYPES.optional)(
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

    test.each(EDUCATION_NUMBER_TYPES)(
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
            companyNumber: COMPANY_NUMBER_TYPES,
            charityNumber: concat(
                CHARITY_NUMBER_TYPES.required,
                CHARITY_NUMBER_TYPES.optional
            ),
            educationNumber: EDUCATION_NUMBER_TYPES
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
});

describe('Contacts', () => {
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

        assertMessagesByKey(
            { [fieldName]: { year: 2000, month: 2, day: 31 } },
            ['Enter a real date']
        );

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

    test.each(CONTACT_EXCLUDED_TYPES)(
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

            assertMessagesByKey({ [fieldName]: null }, [
                'Enter a full UK address'
            ]);

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
});

describe('Bank details', () => {
    test('requires valid bank details', () => {
        expect(
            messagesByKey({
                bankAccountName: null,
                bankSortCode: null,
                bankAccountNumber: null
            })
        ).toMatchSnapshot();
    });

    test('valid bank statement upload', () => {
        assertValidByKey({
            bankStatement: {
                filename: 'example.pdf',
                size: 123,
                type: 'application/pdf'
            }
        });

        assertMessagesByKey({ bankStatement: null }, [
            'Provide a bank statement'
        ]);
    });
});
