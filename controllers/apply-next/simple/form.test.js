/* eslint-env jest */
// @ts-nocheck
'use strict';
const { includes, flatMap, map } = require('lodash');
const faker = require('faker');

const validateModel = require('../lib/validate-model');
const validateForm = require('../lib/validate-form');

const { mockStartDate, mockFullForm } = require('./mocks');
const { ORGANISATION_TYPES } = require('./constants');
const formBuilder = require('./form');

function testValidate(data = {}) {
    const result = validateForm({
        form: formBuilder({ locale: 'en', data: data }),
        data: data
    });

    return result;
}

function messagesFor(validationResult) {
    return map(validationResult.messages, 'msg');
}

function assertAllErrors(data, messages) {
    expect(testValidate(data).error).toBeInstanceOf(Error);
    expect(messagesFor(testValidate(data))).toEqual(messages);
}

function assertMessagesByKey(data, messages) {
    const validation = testValidate(data);
    const messagesByKey = validation.messages.filter(message => {
        return includes(Object.keys(data), message.param);
    });

    expect(map(messagesByKey, 'msg')).toEqual(messages);
}

function assertValidByKey(data) {
    const validation = testValidate(data);
    const messagesByKey = validation.messages.filter(message => {
        return includes(Object.keys(data), message.param);
    });

    expect(messagesByKey).toHaveLength(0);
}

describe('form model', () => {
    test('validate model shape', () => {
        validateModel(formBuilder({ locale: 'en' }));
    });

    function validate(mock) {
        const form = formBuilder({ locale: 'en' });
        return form.schema.validate(mock);
    }

    test('invalid when empty', () => {
        assertAllErrors({}, [
            'Enter a project name',
            'Choose a country',
            'Choose a location',
            'Enter a description',
            'Enter a real postcode',
            'Tell us about your project',
            'Tell us how your project meet at least one of our funding priorities',
            'Tell us how your project involves your community',
            'Enter a project budget',
            'Enter a total cost for your project',
            'Answer yes or no',
            'Enter the full legal name of the organisation',
            'Enter a full UK address',
            'Choose a type of organisation',
            'Enter a day and month',
            'Enter a total income for the year',
            'Enter first name',
            'Enter last name',
            'Enter an email address',
            'Enter a UK telephone number',
            'Enter first name',
            'Enter last name',
            'Choose a role',
            'Enter an email address',
            'Enter a UK telephone number',
            'Enter the name on the bank account',
            'Enter a sort-code',
            'Enter an account number',
            'Provide a bank statement'
        ]);
    });

    test('project name is required', () => {
        function value(val) {
            return { projectName: val };
        }

        assertMessagesByKey(value(null), ['Enter a project name']);
        assertValidByKey(value(faker.lorem.words()));
    });

    test('project start date must be at least 12 weeks in the future', () => {
        function value(val) {
            return { projectStartDate: val };
        }

        assertValidByKey(value(mockStartDate(12)));
        assertMessagesByKey(value(null), ['Enter a date']);
        assertMessagesByKey(value({ day: 31, month: 2, year: 2030 }), [
            'Enter a real date'
        ]);
        assertMessagesByKey(value(mockStartDate(6)), [
            expect.stringMatching(/Date you start the project must be after/)
        ]);
    });

    test('validate full form with company number', () => {
        expect(
            validate(
                mockFullForm({
                    country: 'england',
                    organisationType: ORGANISATION_TYPES.NOT_FOR_PROFIT_COMPANY
                })
            ).error
        ).toBeInstanceOf(Error);

        expect(
            validate(
                mockFullForm({
                    country: 'england',
                    organisationType: ORGANISATION_TYPES.NOT_FOR_PROFIT_COMPANY,
                    companyNumber: '123456789'
                })
            ).error
        ).toBeNull();
    });

    test('validate full form with charity number', () => {
        expect(
            validate(
                mockFullForm({
                    country: 'england',
                    organisationType: ORGANISATION_TYPES.NOT_FOR_PROFIT_COMPANY
                })
            ).error
        ).toBeInstanceOf(Error);

        expect(
            validate(
                mockFullForm({
                    country: 'england',
                    organisationType:
                        ORGANISATION_TYPES.UNINCORPORATED_REGISTERED_CHARITY,
                    charityNumber: '123456789'
                })
            ).error
        ).toBeNull();
    });

    test('validate full form with department for education number', () => {
        const invalid = mockFullForm({
            country: 'england',
            organisationType: ORGANISATION_TYPES.SCHOOL
        });

        expect(validate(invalid).error).toBeInstanceOf(Error);

        const valid = mockFullForm({
            country: 'england',
            organisationType: ORGANISATION_TYPES.SCHOOL,
            educationNumber: '123456789'
        });

        expect(validate(valid).error).toBeNull();
    });

    test('validate full form with no required registration numbers', () => {
        expect(
            validate(
                mockFullForm({
                    country: 'england',
                    organisationType: ORGANISATION_TYPES.UNREGISTERED_VCO
                })
            ).error
        ).toBeNull();
    });

    function fieldNamesFor(sectionSlug, stepTitle) {
        return function(data) {
            const form = formBuilder({ locale: 'en', data: data });
            const section = form.sections.find(s => s.slug === sectionSlug);
            const step = section.steps.find(s => s.title === stepTitle);
            return map(flatMap(step.fieldsets, 'fields'), f => f.name);
        };
    }

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

    test('exclude address and date of birth for schools or statutory bodies', () => {
        const mainContactFn = fieldNamesFor('main-contact', 'Main contact');

        const mainContactDefaultFields = [
            'mainContactFirstName',
            'mainContactLastName',
            'mainContactDateOfBirth',
            'mainContactAddress',
            'mainContactAddressHistory',
            'mainContactEmail',
            'mainContactPhone',
            'mainContactCommunicationNeeds'
        ];

        const mainContactReducedFields = [
            'mainContactFirstName',
            'mainContactLastName',
            'mainContactEmail',
            'mainContactPhone',
            'mainContactCommunicationNeeds'
        ];

        expect(mainContactFn({})).toEqual(mainContactDefaultFields);
        expect(
            mainContactFn({ organisationType: ORGANISATION_TYPES.SCHOOL })
        ).toEqual(mainContactReducedFields);
        expect(
            mainContactFn({
                organisationType: ORGANISATION_TYPES.STATUTORY_BODY
            })
        ).toEqual(mainContactReducedFields);

        const seniorContactFn = fieldNamesFor(
            'senior-contact',
            'Senior contact'
        );

        const seniorContactDefaultFields = [
            'seniorContactFirstName',
            'seniorContactLastName',
            'seniorContactRole',
            'seniorContactDateOfBirth',
            'seniorContactAddress',
            'seniorContactAddressHistory',
            'seniorContactEmail',
            'seniorContactPhone',
            'seniorContactCommunicationNeeds'
        ];

        const seniorContactReducedFields = [
            'seniorContactFirstName',
            'seniorContactLastName',
            'seniorContactRole',
            'seniorContactEmail',
            'seniorContactPhone',
            'seniorContactCommunicationNeeds'
        ];

        expect(seniorContactFn({})).toEqual(seniorContactDefaultFields);
        expect(
            seniorContactFn({ organisationType: ORGANISATION_TYPES.SCHOOL })
        ).toEqual(seniorContactReducedFields);
        expect(
            seniorContactFn({
                organisationType: ORGANISATION_TYPES.STATUTORY_BODY
            })
        ).toEqual(seniorContactReducedFields);
    });
});
