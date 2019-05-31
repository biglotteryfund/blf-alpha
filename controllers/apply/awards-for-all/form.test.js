/* eslint-env jest */
// @ts-nocheck
'use strict';
const { includes, flatMap, map } = require('lodash');
const faker = require('faker');

const validateModel = require('../form-router-next/lib/validate-model');
const validateForm = require('../form-router-next/lib/validate-form');

const {
    mockAddress,
    mockDateOfBirth,
    mockStartDate,
    mockFullForm
} = require('./mocks');
const { ORGANISATION_TYPES } = require('./constants');
const formBuilder = require('./form');

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

function fieldNamesFor(sectionSlug, stepTitle) {
    return function(data) {
        const form = formBuilder({ locale: 'en', data: data });
        const section = form.sections.find(s => s.slug === sectionSlug);
        const step = section.steps.find(s => s.title === stepTitle);
        return map(flatMap(step.fieldsets, 'fields'), f => f.name);
    };
}

describe('form model', () => {
    test('validate model shape', () => {
        validateModel(formBuilder({ locale: 'en' }));
    });

    test('project name is required', () => {
        function value(val) {
            return { projectName: val };
        }

        assertMessagesByKey(value(null), ['Enter a project name']);
        assertValidByKey(value(faker.lorem.words()));
    });

    test('project start date must be at least 12 weeks in the future', () => {
        function value(startDate, endDate) {
            return {
                projectDateRange: { startDate, endDate }
            };
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

        const fieldNamesFn = fieldNamesFor(
            'beneficiaries',
            'People who speak Welsh'
        );

        expect(fieldNamesFn({ projectCountry: 'england' })).toEqual([]);
        expect(fieldNamesFn({ projectCountry: 'scotland' })).toEqual([]);
        expect(fieldNamesFn({ projectCountry: 'northern-ireland' })).toEqual(
            []
        );
        expect(fieldNamesFn({ projectCountry: 'wales' })).toEqual([
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
        assertMessagesByKey(value('northern-ireland'), ['Choose an option']);
        assertMessagesByKey(value('northern-ireland', 'not-a-valid-choice'), [
            'Choose an option'
        ]);

        const fieldNamesFn = fieldNamesFor('beneficiaries', 'Community');

        expect(fieldNamesFn({ projectCountry: 'england' })).toEqual([]);
        expect(fieldNamesFn({ projectCountry: 'scotland' })).toEqual([]);
        expect(fieldNamesFn({ projectCountry: 'wales' })).toEqual([]);
        expect(fieldNamesFn({ projectCountry: 'northern-ireland' })).toEqual([
            'beneficiariesNorthernIrelandCommunity'
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
        assertMessagesByKey(value(ORGANISATION_TYPES.NOT_FOR_PROFIT_COMPANY), [
            'Enter your organisation’s Companies House number'
        ]);
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
            organisationType: ORGANISATION_TYPES.UNREGISTERED_VCO
        });
        assertValid(mock);
    });

    test('registration numbers shown based on organisation type', () => {
        const fieldNamesFn = fieldNamesFor(
            'organisation',
            'Registration numbers'
        );

        expect(fieldNamesFn({})).toEqual([]);

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
            const result = fieldNamesFn({ organisationType: type });
            expect(result).toEqual(expected);
        });
    });

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

    describe('senior contact', () => {
        testDateOfBirthField('seniorContactDateOfBirth', 18);

        testAddressField('seniorContactAddress');

        test('contact fields not included for schools and statutory bodies', () => {
            const seniorContactFn = fieldNamesFor(
                'senior-contact',
                'Senior contact'
            );

            expect(seniorContactFn({})).toEqual([
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
                expect(seniorContactFn({ organisationType: orgType })).toEqual([
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

    describe('main contact', () => {
        testDateOfBirthField('mainContactDateOfBirth', 16);

        testAddressField('mainContactAddress');

        test('contact fields not included for schools and statutory bodies', () => {
            const mainContactFn = fieldNamesFor('main-contact', 'Main contact');

            expect(mainContactFn({})).toEqual([
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
                expect(mainContactFn({ organisationType: orgType })).toEqual([
                    'mainContactFirstName',
                    'mainContactLastName',
                    'mainContactEmail',
                    'mainContactPhone',
                    'mainContactCommunicationNeeds'
                ]);
            });
        });
    });
});
