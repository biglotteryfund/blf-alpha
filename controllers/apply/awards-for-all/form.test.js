/* eslint-env jest */
// @ts-nocheck
'use strict';
const includes = require('lodash/includes');
const map = require('lodash/map');
const mapFp = require('lodash/fp/map');
const flatMap = require('lodash/flatMap');
const random = require('lodash/random');
const range = require('lodash/range');
const sample = require('lodash/sample');
const times = require('lodash/times');
const faker = require('faker');

const validateModel = require('../form-router-next/lib/validate-model');
const validateForm = require('../form-router-next/lib/validate-form');

const {
    mockAddress,
    mockBudget,
    mockDateOfBirth,
    mockStartDate,
    mockFullForm
} = require('./mocks');

const { ORGANISATION_TYPES } = require('./constants');
const formBuilder = require('./form');

const mapNames = mapFp('name');

function testValidate(data) {
    return validateForm(formBuilder({ locale: 'en', data }), data);
}

function assertMessagesByKey(data, messages) {
    const validation = testValidate(data);
    const messagesByKey = validation.messages.filter(message => {
        return includes(Object.keys(data), message.param);
    });

    expect(map(messagesByKey, 'msg')).toEqual(messages);
}

function assertValid(data) {
    const validationResult = testValidate(data);
    expect(validationResult.isValid).toBeTruthy();
}

function assertValidByKey(data) {
    const validation = testValidate(data);
    const messagesByKey = validation.messages.filter(message => {
        return includes(Object.keys(data), message.param);
    });

    expect(messagesByKey).toHaveLength(0);
}

function fieldsFor(sectionSlug, stepTitle) {
    return function(data) {
        const form = formBuilder({ locale: 'en', data: data });
        const section = form.sections.find(s => s.slug === sectionSlug);
        const step = section.steps.find(s => s.title === stepTitle);
        return flatMap(step.fieldsets, 'fields');
    };
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

            const fieldsFn = fieldsFor(
                'beneficiaries',
                'People who speak Welsh'
            );

            expect(mapNames(fieldsFn({ projectCountry: 'england' }))).toEqual(
                []
            );
            expect(mapNames(fieldsFn({ projectCountry: 'scotland' }))).toEqual(
                []
            );
            expect(
                mapNames(fieldsFn({ projectCountry: 'northern-ireland' }))
            ).toEqual([]);
            expect(mapNames(fieldsFn({ projectCountry: 'wales' }))).toEqual([
                'beneficiariesWelshLanguage'
            ]);
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

            const fieldsFn = fieldsFor('beneficiaries', 'Community');

            expect(mapNames(fieldsFn({ projectCountry: 'england' }))).toEqual(
                []
            );
            expect(mapNames(fieldsFn({ projectCountry: 'scotland' }))).toEqual(
                []
            );
            expect(mapNames(fieldsFn({ projectCountry: 'wales' }))).toEqual([]);
            expect(
                mapNames(fieldsFn({ projectCountry: 'northern-ireland' }))
            ).toEqual(['beneficiariesNorthernIrelandCommunity']);
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
            const fieldsFn = fieldsFor('organisation', 'Registration numbers');

            expect(mapNames(fieldsFn({}))).toEqual([]);

            const mappings = {
                [ORGANISATION_TYPES.UNINCORPORATED_REGISTERED_CHARITY]: [
                    'charityNumber'
                ],
                [ORGANISATION_TYPES.CIO]: ['charityNumber'],
                [ORGANISATION_TYPES.NOT_FOR_PROFIT_COMPANY]: [
                    'companyNumber',
                    'charityNumber'
                ],
                [ORGANISATION_TYPES.SCHOOL]: ['educationNumber']
            };

            map(mappings, (expected, type) => {
                const result = mapNames(fieldsFn({ organisationType: type }));
                expect(result).toEqual(expected);
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
            const fieldsFn = fieldsFor('senior-contact', 'Senior contact');
            const fields = fieldsFn({ organisationType: type });
            const field = fields.find(f => f.name === 'seniorContactRole');
            return field.options.map(option => option.value);
        }

        test('include all roles if no organisation type is provided', () => {
            expect(rolesFor(null)).toEqual([
                'trustee',
                'chair',
                'vice-chair',
                'secretary',
                'treasurer',
                'company-director',
                'company-secretary',
                'chief-executive',
                'chief-executive-officer',
                'parish-clerk',
                'head-teacher',
                'chancellor',
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
                    ['Choose a role']
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
                ['trustee', 'chair', 'vice-chair', 'treasurer']
            );

            assertRolesForType(ORGANISATION_TYPES.CIO, [
                'trustee',
                'chair',
                'vice-chair',
                'treasurer',
                'chief-executive-officer'
            ]);

            assertRolesForType(ORGANISATION_TYPES.NOT_FOR_PROFIT_COMPANY, [
                'company-director',
                'company-secretary'
            ]);

            assertRolesForType(ORGANISATION_TYPES.SCHOOL, [
                'head-teacher',
                'chancellor',
                'vice-chancellor'
            ]);

            assertRolesForType(ORGANISATION_TYPES.STATUTORY_BODY, [
                'parish-clerk',
                'chief-executive'
            ]);
        });

        test('contact fields not included for schools and statutory bodies', () => {
            const fieldsFn = fieldsFor('senior-contact', 'Senior contact');

            expect(mapNames(fieldsFn({}))).toEqual([
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
                expect(
                    mapNames(fieldsFn({ organisationType: orgType }))
                ).toEqual([
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
            const fieldsFn = fieldsFor('main-contact', 'Main contact');

            expect(mapNames(fieldsFn({}))).toEqual([
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
                expect(
                    mapNames(fieldsFn({ organisationType: orgType }))
                ).toEqual([
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
            all: 'empty',
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
                }
            ]
        });

        const partialForm = formBuilder({
            locale: 'en',
            data: mockFullForm({ country: 'england' })
        });

        expect(partialForm.progress).toEqual({
            all: 'incomplete',
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
            all: 'complete',
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
                }
            ]
        });
    });
});
