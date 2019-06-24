/* eslint-env jest */
// @ts-nocheck
'use strict';
const includes = require('lodash/includes');
const map = require('lodash/map');
const random = require('lodash/random');
const range = require('lodash/range');
const sample = require('lodash/sample');
const times = require('lodash/times');
const values = require('lodash/values');
const faker = require('faker');
const moment = require('moment');

const formBuilder = require('./form');
const { BENEFICIARY_GROUPS, ORGANISATION_TYPES } = require('./constants');
const validateModel = require('../form-router-next/lib/validate-model');

function toDateParts(dt) {
    return { day: dt.date(), month: dt.month() + 1, year: dt.year() };
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
        line1: faker.address.streetAddress(),
        townCity: faker.address.city(),
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

function mockFullForm({
    country = 'england',
    organisationType,
    seniorContactRole,
    companyNumber = null,
    charityNumber = null,
    educationNumber = null
}) {
    return {
        projectName: faker.lorem.words(5),
        projectCountry: country,
        projectDateRange: {
            startDate: mockStartDate(12),
            endDate: mockStartDate(30)
        },
        projectLocation: 'west-midlands',
        projectLocationDescription: faker.lorem.sentence(),
        projectPostcode: 'B15 1TR',
        yourIdeaProject: faker.lorem.words(250),
        yourIdeaPriorities: faker.lorem.words(100),
        yourIdeaCommunity: faker.lorem.words(150),
        projectBudget: mockBudget(),
        projectTotalCosts: 20000,
        beneficiariesGroupsCheck: 'yes',
        beneficiariesGroups: values(BENEFICIARY_GROUPS),
        beneficiariesGroupsOther: undefined,
        beneficiariesGroupsEthnicBackground: ['african', 'caribbean'],
        beneficiariesGroupsGender: ['non-binary'],
        beneficiariesGroupsAge: ['0-12', '13-24'],
        beneficiariesGroupsDisabledPeople: ['sensory'],
        beneficiariesGroupsReligion: ['sikh'],
        beneficiariesGroupsReligionOther: undefined,
        organisationLegalName: faker.company.companyName(),
        organisationTradingName: faker.company.companyName(),
        organisationAddress: mockAddress(),
        organisationType: organisationType,
        companyNumber: companyNumber,
        charityNumber: charityNumber,
        educationNumber: educationNumber,
        accountingYearDate: { day: 1, month: 3 },
        totalIncomeYear: faker.random.number({ min: 10000, max: 1000000 }),
        mainContactFirstName: faker.name.firstName(),
        mainContactLastName: faker.name.lastName(),
        mainContactDateOfBirth: mockDateOfBirth(16),
        mainContactAddress: mockAddress(),
        mainContactAddressHistory: {
            currentAddressMeetsMinimum: 'no',
            previousAddress: mockAddress()
        },
        mainContactEmail: faker.internet.exampleEmail(),
        mainContactPhone: '0345 4 10 20 30',
        mainContactCommunicationNeeds: '',
        seniorContactFirstName: faker.name.firstName(),
        seniorContactLastName: faker.name.lastName(),
        seniorContactRole: seniorContactRole,
        seniorContactDateOfBirth: mockDateOfBirth(18),
        seniorContactAddress: mockAddress(),
        seniorContactAddressHistory: {
            currentAddressMeetsMinimum: 'yes',
            previousAddress: null
        },
        seniorContactEmail: faker.internet.exampleEmail(),
        seniorContactPhone: '020 7211 1888',
        seniorContactCommunicationNeeds: '',
        bankAccountName: faker.company.companyName(),
        bankSortCode: '108800',
        bankAccountNumber: '00012345',
        buildingSocietyNumber: undefined,
        bankStatement: {
            filename: 'example.pdf',
            size: 123,
            type: 'application/pdf'
        },
        termsAgreement1: 'yes',
        termsAgreement2: 'yes',
        termsAgreement3: 'yes',
        termsAgreement4: 'yes',
        termsPersonName: `${faker.name.firstName()} ${faker.name.lastName()}`,
        termsPersonPosition: faker.name.jobTitle()
    };
}

function testValidate(data) {
    return formBuilder({ locale: 'en', data }).validation;
}

function assertMessagesByKey(data, messages) {
    const validationResult = testValidate(data);
    const messagesByKey = validationResult.messages.filter(message => {
        return includes(Object.keys(data), message.param);
    });

    expect(map(messagesByKey, 'msg')).toEqual(messages);
}

function assertValid(data) {
    const validationResult = testValidate(data);
    expect(validationResult.isValid).toBeTruthy();
}

function assertValidByKey(data) {
    const validationResult = testValidate(data);
    const messagesByKey = validationResult.messages.filter(message => {
        return includes(Object.keys(data), message.param);
    });

    expect(messagesByKey).toHaveLength(0);
}

describe('Form validations', () => {
    describe('Project details', () => {
        test('project name must be provided', () => {
            function value(val) {
                return { projectName: val };
            }

            assertMessagesByKey(value(null), ['Enter a project name']);
            assertValidByKey(value(faker.lorem.words()));
        });

        test('project dates must be within range', () => {
            function value(startDate, endDate) {
                return { projectDateRange: { startDate, endDate } };
            }

            assertValidByKey(value(mockStartDate(12), mockStartDate(30)));
            assertMessagesByKey(value(null, null), ['Enter a date']);
            assertMessagesByKey(
                value(
                    { day: 31, month: 2, year: 2030 },
                    { day: 31, month: 24, year: 2030 }
                ),
                ['Enter a valid start and end date']
            );
            assertMessagesByKey(
                value(
                    { day: 1, month: 1, year: 2020 },
                    { day: 1, month: 1, year: 2030 }
                ),
                [expect.stringMatching(/End date must be within/)]
            );
        });

        test('project country must be provided', () => {
            function value(val) {
                return { projectCountry: val };
            }

            const randomCountry = sample([
                'england',
                'northern-ireland',
                'scotland',
                'wales'
            ]);

            assertValidByKey(value(randomCountry));
            assertMessagesByKey(value('not-a-country'), ['Choose a country']);
        });

        test('project postcode must be a valid UK postcode', () => {
            function value(val) {
                return { projectPostcode: val };
            }

            assertValidByKey(value('B15 1TR'));

            const invalidMessages = ['Enter a real postcode'];
            assertMessagesByKey(value(null), invalidMessages);
            assertMessagesByKey(value('not a postcode'), invalidMessages);
        });
    });

    describe('Project idea', () => {
        test('project questions must be within word-counts', () => {
            function testWordCountRange(fieldName, min, max) {
                range(min, max, 50).forEach(wordCount => {
                    assertValidByKey({
                        [fieldName]: faker.lorem.words(wordCount)
                    });
                });

                assertMessagesByKey(
                    { [fieldName]: faker.lorem.words(min - 1) },
                    [expect.stringMatching(/Answer must be at least/)]
                );

                assertMessagesByKey(
                    { [fieldName]: faker.lorem.words(max + 1) },
                    [expect.stringMatching(/Answer must be no more than/)]
                );
            }

            testWordCountRange('yourIdeaProject', 50, 300);
            testWordCountRange('yourIdeaPriorities', 50, 150);
            testWordCountRange('yourIdeaCommunity', 50, 200);
        });
    });

    describe('Project budget', () => {
        function value(budget, totalCosts = 20000) {
            return { projectBudget: budget, projectTotalCosts: totalCosts };
        }

        test('must provide a valid budget', () => {
            assertValidByKey(value(mockBudget()));

            const defaultMessages = ['Enter a project budget'];
            assertMessagesByKey(value([]), defaultMessages);

            const budgetWithoutCosts = times(5, () => ({
                item: faker.lorem.words(5)
            }));

            assertMessagesByKey(value(budgetWithoutCosts), defaultMessages);
        });

        test('total project costs must be less than £10,000', () => {
            const budget = times(10, () => ({
                item: faker.lorem.words(5),
                cost: 1100
            }));

            assertMessagesByKey(value(budget), [
                'Total project costs must be less than £10,000'
            ]);
        });

        test('project total costs must be at least value of project budget', () => {
            assertValidByKey(value(mockBudget()));

            assertMessagesByKey(value(mockBudget(), null), [
                'Total cost must be a real number'
            ]);
            assertMessagesByKey(value(mockBudget(), Infinity), [
                'Enter a total cost for your project'
            ]);
            assertMessagesByKey(value(mockBudget(), 1000), [
                'Total cost must be the same as or higher than the amount you’re asking us to fund'
            ]);
        });
    });

    describe('Beneficiaries', () => {
        test('skip section based on screening question', () => {
            const formWithYes = formBuilder({
                locale: 'en',
                data: { beneficiariesGroupsCheck: 'yes' }
            });

            const formWithNo = formBuilder({
                locale: 'en',
                data: { beneficiariesGroupsCheck: 'no' }
            });

            expect(
                formWithYes.pagination({
                    baseUrl: '/apply/awards-for-all',
                    sectionSlug: 'beneficiaries',
                    currentStepIndex: 0
                })
            ).toEqual({
                nextUrl: '/apply/awards-for-all/beneficiaries/2',
                previousUrl: '/apply/awards-for-all/your-project/5'
            });

            expect(
                formWithNo.pagination({
                    baseUrl: '/apply/awards-for-all',
                    sectionSlug: 'organisation',
                    currentStepIndex: 0
                })
            ).toEqual({
                nextUrl: '/apply/awards-for-all/organisation/2',
                previousUrl: '/apply/awards-for-all/beneficiaries/1'
            });
        });

        test('welsh language question required for applicants in Wales', () => {
            function value(country, val) {
                return {
                    projectCountry: country,
                    beneficiariesWelshLanguage: val
                };
            }

            assertValidByKey(value('england'));
            assertValidByKey(value('scotland'));
            assertValidByKey(value('wales', 'all'));
            assertMessagesByKey(value('wales'), ['Choose an option']);
            assertMessagesByKey(value('wales', 'not-a-valid-choice'), [
                'Choose an option'
            ]);

            [
                { country: 'england', expected: [] },
                { country: 'scotland', expected: [] },
                { country: 'northern-ireland', expected: [] },
                { country: 'wales', expected: ['beneficiariesWelshLanguage'] }
            ].forEach(item => {
                const fieldNames = formBuilder({
                    locale: 'en',
                    data: { projectCountry: item.country }
                })
                    .getCurrentFieldsForStep('beneficiaries', 7)
                    .map(field => field.name);

                expect(fieldNames).toEqual(item.expected);
            });
        });

        test('additional community question in Northern Ireland', () => {
            function value(country, val) {
                return {
                    projectCountry: country,
                    beneficiariesNorthernIrelandCommunity: val
                };
            }

            assertValidByKey(value('england'));
            assertValidByKey(value('scotland'));
            assertValidByKey(value('wales'));
            assertValidByKey(value('northern-ireland', 'mainly-catholic'));
            assertValidByKey(value('northern-ireland', 'mainly-protestant'));
            assertMessagesByKey(value('northern-ireland'), [
                'Choose an option'
            ]);
            assertMessagesByKey(
                value('northern-ireland', 'not-a-valid-choice'),
                ['Choose an option']
            );

            [
                { country: 'england', expected: [] },
                { country: 'scotland', expected: [] },
                {
                    country: 'northern-ireland',
                    expected: ['beneficiariesNorthernIrelandCommunity']
                },
                { country: 'wales', expected: [] }
            ].forEach(item => {
                const fieldNames = formBuilder({
                    locale: 'en',
                    data: { projectCountry: item.country }
                })
                    .getCurrentFieldsForStep('beneficiaries', 8)
                    .map(field => field.name);

                expect(fieldNames).toEqual(item.expected);
            });
        });
    });

    describe('Your organisation', () => {
        test('organisation legal name must be provided', () => {
            function value(val) {
                return { organisationLegalName: val };
            }

            assertValidByKey(value(faker.company.companyName()));
            assertMessagesByKey(value(null), [
                'Enter the full legal name of the organisation'
            ]);
        });

        test('organisation address must be provided', () => {
            function value(val) {
                return { organisationAddress: val };
            }

            assertValidByKey(value(mockAddress()));
            assertMessagesByKey(value(null), ['Enter a full UK address']);
            assertMessagesByKey(
                value({
                    line1: '3 Embassy Drive',
                    county: 'West Midlands',
                    postcode: 'B15 1TR'
                }),
                ['Enter a full UK address']
            );
            assertMessagesByKey(
                value({ ...mockAddress(), ...{ postcode: 'not a postcode' } }),
                ['Enter a real postcode']
            );
        });

        test('must be a valid organisation type', () => {
            function value(val) {
                return { organisationType: val };
            }

            assertValidByKey(value(sample(Object.values(ORGANISATION_TYPES))));
            const defaultMessages = ['Choose a type of organisation'];
            assertMessagesByKey(value(null), defaultMessages);
            assertMessagesByKey(value('not-an-option'), defaultMessages);
        });

        test('accounting year end must be a valid day and month', () => {
            function value(day, month) {
                return { accountingYearDate: { day, month } };
            }

            assertValidByKey(value(12, 12));
            assertMessagesByKey(value(null), ['Enter a day and month']);
            assertMessagesByKey(value(31, 2), ['Enter a real day and month']);
        });

        test('total income for year must be a valid number', () => {
            function value(val) {
                return { totalIncomeYear: val };
            }

            assertValidByKey(value(random(1000, 1000000)));
            assertMessagesByKey(value(null), [
                'Enter a total income for the year'
            ]);
            assertMessagesByKey(value(Infinity), [
                'Total income must be a real number'
            ]);
        });

        test('company number required if not for profit company', () => {
            function value(type, val) {
                return {
                    organisationType: type,
                    companyNumber: val
                };
            }

            assertValidByKey(value(ORGANISATION_TYPES.CIO));
            assertValidByKey(
                value(ORGANISATION_TYPES.NOT_FOR_PROFIT_COMPANY, 'CE002712')
            );
            assertMessagesByKey(
                value(ORGANISATION_TYPES.NOT_FOR_PROFIT_COMPANY),
                ['Enter your organisation’s Companies House number']
            );
        });

        test('charity number required if CIO or registered charity', () => {
            function value(type, val) {
                return {
                    organisationType: type,
                    charityNumber: val
                };
            }

            assertMessagesByKey(value(ORGANISATION_TYPES.CIO), [
                'Enter your organisation’s charity number'
            ]);

            assertMessagesByKey(
                value(ORGANISATION_TYPES.UNINCORPORATED_REGISTERED_CHARITY),
                ['Enter your organisation’s charity number']
            );

            assertValidByKey(value(ORGANISATION_TYPES.CIO, '1160580'));
            assertValidByKey(
                value(
                    ORGANISATION_TYPES.UNINCORPORATED_REGISTERED_CHARITY,
                    '1160580'
                )
            );
            assertValidByKey(value(ORGANISATION_TYPES.NOT_FOR_PROFIT_COMPANY));
        });

        test('education number required if school', () => {
            function value(type, val) {
                return {
                    organisationType: type,
                    educationNumber: val
                };
            }

            assertMessagesByKey(value(ORGANISATION_TYPES.SCHOOL), [
                'Enter your organisation’s Department for Education number'
            ]);
            assertValidByKey(value(ORGANISATION_TYPES.SCHOOL, '1160580'));
            assertValidByKey(value(ORGANISATION_TYPES.CIO));
        });

        test('no registration numbers required if unregistered VCO', () => {
            const mock = mockFullForm({
                country: 'england',
                organisationType: ORGANISATION_TYPES.UNREGISTERED_VCO,
                seniorContactRole: 'chair'
            });
            assertValid(mock);
        });

        test('registration numbers shown based on organisation type', () => {
            const defaultFieldNames = formBuilder({ locale: 'en' })
                .getCurrentFieldsForStep('organisation', 2)
                .map(field => field.name);

            expect(defaultFieldNames).toEqual([]);

            const mappings = {
                [ORGANISATION_TYPES.UNINCORPORATED_REGISTERED_CHARITY]: [
                    'charityNumber'
                ],
                [ORGANISATION_TYPES.CIO]: ['charityNumber'],
                [ORGANISATION_TYPES.NOT_FOR_PROFIT_COMPANY]: [
                    'companyNumber',
                    'charityNumber'
                ],
                [ORGANISATION_TYPES.SCHOOL]: ['educationNumber'],
                [ORGANISATION_TYPES.COLLEGE_OR_UNIVERSITY]: ['educationNumber']
            };

            map(mappings, (expected, type) => {
                const fieldNames = formBuilder({
                    locale: 'en',
                    data: { organisationType: type }
                })
                    .getCurrentFieldsForStep('organisation', 3)
                    .map(field => field.name);

                expect(fieldNames).toEqual(expected);
            });
        });
    });

    function testNameFields(firstFieldName, lastFieldName) {
        test('first and last name must be provided', () => {
            function value(firstName, lastName) {
                return {
                    [firstFieldName]: firstName,
                    [lastFieldName]: lastName
                };
            }

            assertValidByKey(
                value(faker.name.firstName(), faker.name.lastName())
            );

            assertMessagesByKey(value(null, null), [
                'Enter first name',
                'Enter last name'
            ]);
        });
    }

    function testEmailPhoneFields(emailFieldName, phoneFieldName) {
        test('email address and phone number must be provided', () => {
            function value(email, phone) {
                return {
                    [emailFieldName]: email,
                    [phoneFieldName]: phone
                };
            }

            assertValidByKey(
                value(faker.internet.exampleEmail(), '0345 4 10 20 30')
            );

            assertMessagesByKey(value('not@anemail', 'not a phone number'), [
                'Email address must be in the correct format, like name@example.com',
                'Enter a real UK telephone number'
            ]);
        });
    }

    function testDateOfBirthField(fieldName, minAge) {
        test(`date of birth must be at least ${minAge}`, () => {
            function value(val) {
                return {
                    [fieldName]: val
                };
            }

            assertMessagesByKey(value(null), ['Enter a date of birth']);
            assertMessagesByKey(value({ year: 2000, month: 2, day: 31 }), [
                'Enter a real date'
            ]);
            assertMessagesByKey(value(mockDateOfBirth(0, minAge - 1)), [
                `Must be at least ${minAge} years old`
            ]);
            assertValidByKey(value(mockDateOfBirth(minAge, 90)));
        });

        test('date of birth is included if there is no organisation type', () => {
            const dobWithoutOrgType = {
                [fieldName]: mockDateOfBirth(minAge, 90)
            };
            expect(testValidate(dobWithoutOrgType).value).toEqual(
                dobWithoutOrgType
            );
        });

        test('date of birth is included when there is a required organisation type', () => {
            const dobWithOrgType = {
                organisationType: ORGANISATION_TYPES.CIO,
                [fieldName]: mockDateOfBirth(minAge, 90)
            };
            expect(testValidate(dobWithOrgType).value).toEqual(dobWithOrgType);
        });

        test('date of birth value stripped for schools and statutory bodies', () => {
            [
                ORGANISATION_TYPES.SCHOOL,
                ORGANISATION_TYPES.STATUTORY_BODY
            ].forEach(orgType => {
                const dobWithSchool = {
                    organisationType: orgType,
                    [fieldName]: mockDateOfBirth(minAge, 90)
                };

                expect(testValidate(dobWithSchool).value).toEqual({
                    organisationType: orgType
                });

                assertValidByKey({
                    organisationType: orgType
                });
            });
        });
    }

    function testAddressField(fieldName) {
        test('address is valid', () => {
            function value(val) {
                return {
                    [fieldName]: val
                };
            }

            assertValidByKey(value(mockAddress()));
            assertMessagesByKey(value(null), ['Enter a full UK address']);
            assertMessagesByKey(
                value({
                    line1: '3 Embassy Drive',
                    county: 'West Midlands',
                    postcode: 'B15 1TR'
                }),
                ['Enter a full UK address']
            );
            assertMessagesByKey(
                value({ ...mockAddress(), ...{ postcode: 'not a postcode' } }),
                ['Enter a real postcode']
            );
        });

        test('address is included when there is a required organisation type', () => {
            const valueWithOrgType = {
                organisationType: ORGANISATION_TYPES.CIO,
                [fieldName]: mockAddress()
            };
            expect(testValidate(valueWithOrgType).value).toEqual(
                valueWithOrgType
            );
        });

        test('address is included when there is no organisation type', () => {
            const valueWithoutOrgType = {
                [fieldName]: mockAddress()
            };
            expect(testValidate(valueWithoutOrgType).value).toEqual(
                valueWithoutOrgType
            );
        });

        test('address value stripped for schools and statutory bodies', () => {
            [
                ORGANISATION_TYPES.SCHOOL,
                ORGANISATION_TYPES.STATUTORY_BODY
            ].forEach(orgType => {
                expect(
                    testValidate({
                        organisationType: orgType,
                        [fieldName]: mockAddress()
                    }).value
                ).toEqual({
                    organisationType: orgType
                });

                assertValidByKey({
                    organisationType: orgType
                });
            });
        });
    }

    function testAddressHistoryField(fieldName) {
        test('require address history if less than three years at current address', () => {
            function value(meetsMinimum, previousAddress = null) {
                return {
                    [fieldName]: {
                        currentAddressMeetsMinimum: meetsMinimum,
                        previousAddress: previousAddress
                    }
                };
            }

            assertValidByKey(value('yes'));
            assertValidByKey(value('no', mockAddress()));

            assertMessagesByKey(
                value('no', {
                    line1: faker.address.streetAddress(),
                    townCity: faker.address.city()
                }),
                ['Enter a full UK address']
            );
        });

        test('optional if organisationType is a school or statutory-body', () => {
            function value(orgType) {
                return { organisationType: orgType, [fieldName]: null };
            }

            [
                ORGANISATION_TYPES.SCHOOL,
                ORGANISATION_TYPES.STATUTORY_BODY
            ].forEach(orgType => {
                assertValidByKey(value(orgType));
            });

            assertMessagesByKey(
                value(ORGANISATION_TYPES.NOT_FOR_PROFIT_COMPANY),
                ['Enter a full UK address']
            );
        });
    }

    describe('Senior contact', () => {
        testNameFields('seniorContactFirstName', 'seniorContactLastName');
        testEmailPhoneFields('seniorContactEmail', 'seniorContactPhone');
        testDateOfBirthField('seniorContactDateOfBirth', 18);
        testAddressField('seniorContactAddress');
        testAddressHistoryField('seniorContactAddressHistory');

        function rolesFor(type) {
            const fields = formBuilder({
                locale: 'en',
                data: { organisationType: type }
            }).getCurrentFieldsForStep('senior-contact', 0);
            const field = fields.find(f => f.name === 'seniorContactRole');
            return field.options.map(option => option.value);
        }

        test('include all roles if no organisation type is provided', () => {
            expect(rolesFor(null)).toEqual([
                'chair',
                'chancellor',
                'chief-executive',
                'chief-executive-officer',
                'company-director',
                'company-secretary',
                'deputy-parish-clerk',
                'director',
                'elected-member',
                'head-teacher',
                'parish-clerk',
                'secretary',
                'treasurer',
                'trustee',
                'vice-chair',
                'vice-chancellor'
            ]);
        });

        test('include roles based on organisation type', () => {
            function assertRolesForType(type, expected) {
                const roles = rolesFor(type);

                expect(roles).toEqual(expected);

                assertValidByKey({
                    organisationType: type,
                    seniorContactRole: sample(roles)
                });

                assertMessagesByKey(
                    {
                        organisationType: type,
                        seniorContactRole: 'not-an-option'
                    },
                    ['Choose a valid role']
                );
            }

            assertRolesForType(ORGANISATION_TYPES.UNREGISTERED_VCO, [
                'chair',
                'vice-chair',
                'secretary',
                'treasurer'
            ]);

            assertRolesForType(
                ORGANISATION_TYPES.UNINCORPORATED_REGISTERED_CHARITY,
                ['trustee']
            );

            assertRolesForType(ORGANISATION_TYPES.CIO, [
                'trustee',
                'chief-executive-officer'
            ]);

            assertRolesForType(ORGANISATION_TYPES.NOT_FOR_PROFIT_COMPANY, [
                'company-director',
                'company-secretary'
            ]);

            assertRolesForType(ORGANISATION_TYPES.SCHOOL, ['head-teacher']);

            assertRolesForType(ORGANISATION_TYPES.COLLEGE_OR_UNIVERSITY, [
                'chancellor',
                'vice-chancellor'
            ]);
        });

        test('contact fields not included for schools and statutory bodies', () => {
            const defaultFieldNames = formBuilder({ locale: 'en' })
                .getCurrentFieldsForStep('senior-contact', 0)
                .map(field => field.name);

            expect(defaultFieldNames).toEqual([
                'seniorContactFirstName',
                'seniorContactLastName',
                'seniorContactRole',
                'seniorContactDateOfBirth',
                'seniorContactAddress',
                'seniorContactAddressHistory',
                'seniorContactEmail',
                'seniorContactPhone',
                'seniorContactCommunicationNeeds'
            ]);

            [
                ORGANISATION_TYPES.SCHOOL,
                ORGANISATION_TYPES.STATUTORY_BODY
            ].forEach(orgType => {
                const fieldNames = formBuilder({
                    locale: 'en',
                    data: { organisationType: orgType }
                })
                    .getCurrentFieldsForStep('senior-contact', 0)
                    .map(field => field.name);

                expect(fieldNames).toEqual([
                    'seniorContactFirstName',
                    'seniorContactLastName',
                    'seniorContactRole',
                    'seniorContactEmail',
                    'seniorContactPhone',
                    'seniorContactCommunicationNeeds'
                ]);
            });
        });
    });

    describe('Main contact', () => {
        testNameFields('mainContactFirstName', 'mainContactLastName');
        testEmailPhoneFields('mainContactEmail', 'mainContactPhone');
        testDateOfBirthField('mainContactDateOfBirth', 16);
        testAddressField('mainContactAddress');
        testAddressHistoryField('mainContactAddressHistory');

        test('contact fields not included for schools and statutory bodies', () => {
            const defaultFieldNames = formBuilder({ locale: 'en' })
                .getCurrentFieldsForStep('main-contact', 0)
                .map(field => field.name);

            expect(defaultFieldNames).toEqual([
                'mainContactFirstName',
                'mainContactLastName',
                'mainContactDateOfBirth',
                'mainContactAddress',
                'mainContactAddressHistory',
                'mainContactEmail',
                'mainContactPhone',
                'mainContactCommunicationNeeds'
            ]);

            [
                ORGANISATION_TYPES.SCHOOL,
                ORGANISATION_TYPES.STATUTORY_BODY
            ].forEach(orgType => {
                const fieldNames = formBuilder({
                    locale: 'en',
                    data: { organisationType: orgType }
                })
                    .getCurrentFieldsForStep('main-contact', 0)
                    .map(field => field.name);

                expect(fieldNames).toEqual([
                    'mainContactFirstName',
                    'mainContactLastName',
                    'mainContactEmail',
                    'mainContactPhone',
                    'mainContactCommunicationNeeds'
                ]);
            });
        });
    });

    describe('Bank details', () => {
        test('valid account name', () => {
            function value(val) {
                return { bankAccountName: val };
            }

            assertValidByKey(value(faker.company.companyName()));
            assertMessagesByKey(value(null), [
                'Enter the name on the bank account'
            ]);
        });

        test('valid sort code', () => {
            function value(val) {
                return { bankSortCode: val };
            }

            assertValidByKey(value('108800'));
            assertMessagesByKey(value(null), ['Enter a sort-code']);
        });

        test('valid account number', () => {
            function value(val) {
                return { bankAccountNumber: val };
            }

            assertValidByKey(value('00012345'));
            assertMessagesByKey(value(null), ['Enter an account number']);
        });

        test('valid bank statement upload', () => {
            function value(val) {
                return { bankStatement: val };
            }

            assertValidByKey(
                value({
                    filename: 'example.pdf',
                    size: 123,
                    type: 'application/pdf'
                })
            );
            assertMessagesByKey(value(null), ['Provide a bank statement']);
        });
    });
});

describe('form shape', () => {
    test('validate model shape', () => {
        validateModel(formBuilder({ locale: 'en' }));
    });

    test('progress', () => {
        const emptyForm = formBuilder({ locale: 'en' });
        expect(emptyForm.progress).toEqual({
            isComplete: false,
            sections: [
                {
                    label: 'Your Project',
                    slug: 'your-project',
                    status: 'empty'
                },
                {
                    label: 'Beneficiaries',
                    slug: 'beneficiaries',
                    status: 'empty'
                },
                {
                    label: 'Your organisation',
                    slug: 'organisation',
                    status: 'empty'
                },
                {
                    label: 'Senior contact',
                    slug: 'senior-contact',
                    status: 'empty'
                },
                {
                    label: 'Main contact',
                    slug: 'main-contact',
                    status: 'empty'
                },
                {
                    label: 'Bank details',
                    slug: 'bank-details',
                    status: 'empty'
                },
                {
                    label: 'Terms and Conditions',
                    slug: 'terms-and-conditions',
                    status: 'empty'
                }
            ]
        });

        const partialForm = formBuilder({
            locale: 'en',
            data: mockFullForm({ country: 'england' })
        });

        expect(partialForm.progress).toEqual({
            isComplete: false,
            sections: [
                {
                    label: 'Your Project',
                    slug: 'your-project',
                    status: 'complete'
                },
                {
                    label: 'Beneficiaries',
                    slug: 'beneficiaries',
                    status: 'complete'
                },
                {
                    label: 'Your organisation',
                    slug: 'organisation',
                    status: 'incomplete'
                },
                {
                    label: 'Senior contact',
                    slug: 'senior-contact',
                    status: 'incomplete'
                },
                {
                    label: 'Main contact',
                    slug: 'main-contact',
                    status: 'complete'
                },
                {
                    label: 'Bank details',
                    slug: 'bank-details',
                    status: 'complete'
                },
                {
                    label: 'Terms and Conditions',
                    slug: 'terms-and-conditions',
                    status: 'complete'
                }
            ]
        });

        const completeForm = formBuilder({
            locale: 'en',
            data: mockFullForm({
                country: 'england',
                organisationType: ORGANISATION_TYPES.UNREGISTERED_VCO,
                seniorContactRole: 'chair'
            })
        });

        expect(completeForm.progress).toEqual({
            isComplete: true,
            sections: [
                {
                    label: 'Your Project',
                    slug: 'your-project',
                    status: 'complete'
                },
                {
                    label: 'Beneficiaries',
                    slug: 'beneficiaries',
                    status: 'complete'
                },
                {
                    label: 'Your organisation',
                    slug: 'organisation',
                    status: 'complete'
                },
                {
                    label: 'Senior contact',
                    slug: 'senior-contact',
                    status: 'complete'
                },
                {
                    label: 'Main contact',
                    slug: 'main-contact',
                    status: 'complete'
                },
                {
                    label: 'Bank details',
                    slug: 'bank-details',
                    status: 'complete'
                },
                {
                    label: 'Terms and Conditions',
                    slug: 'terms-and-conditions',
                    status: 'complete'
                }
            ]
        });
    });
});
