/* eslint-env jest */
'use strict';
const { flatMap, map } = require('lodash');

const validateModel = require('../lib/validate-model');

const { mockFullForm } = require('./mocks');
const { ORGANISATION_TYPES } = require('./constants');
const formBuilder = require('./form');

describe('form model', () => {
    test('validate model shape', () => {
        validateModel(formBuilder({ locale: 'en' }));
    });

    function validate(mock) {
        const form = formBuilder({ locale: 'en' });
        return form.schema.validate(mock);
    }

    test('invalid empty form', () => {
        const validationResult = validate({});
        expect(validationResult.error).toBeInstanceOf(Error);
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
