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
                'charity-number'
            ],
            [ORGANISATION_TYPES.CIO]: ['charity-number'],
            [ORGANISATION_TYPES.NOT_FOR_PROFIT_COMPANY]: [
                'company-number',
                'charity-number'
            ],
            [ORGANISATION_TYPES.SCHOOL]: ['education-number']
        };

        map(mappings, (expected, type) => {
            const result = fieldNamesFn({ 'organisation-type': type });
            expect(result).toEqual(expected);
        });
    });

    test('exclude address and date of birth for schools or statutory bodies', () => {
        const mainContactFn = fieldNamesFor('main-contact', 'Main contact');

        const mainContactDefaultFields = [
            'main-contact-first-name',
            'main-contact-last-name',
            'main-contact-dob',
            'main-contact-address',
            'main-contact-address-history',
            'main-contact-email',
            'main-contact-phone',
            'main-contact-communication-needs'
        ];

        const mainContactReducedFields = [
            'main-contact-first-name',
            'main-contact-last-name',
            'main-contact-email',
            'main-contact-phone',
            'main-contact-communication-needs'
        ];

        expect(mainContactFn({})).toEqual(mainContactDefaultFields);
        expect(
            mainContactFn({ 'organisation-type': ORGANISATION_TYPES.SCHOOL })
        ).toEqual(mainContactReducedFields);
        expect(
            mainContactFn({
                'organisation-type': ORGANISATION_TYPES.STATUTORY_BODY
            })
        ).toEqual(mainContactReducedFields);

        const seniorContactFn = fieldNamesFor(
            'senior-contact',
            'Senior contact'
        );

        const seniorContactDefaultFields = [
            'senior-contact-first-name',
            'senior-contact-last-name',
            'senior-contact-role',
            'senior-contact-dob',
            'senior-contact-address',
            'senior-contact-address-history',
            'senior-contact-email',
            'senior-contact-phone',
            'senior-contact-communication-needs'
        ];

        const seniorContactReducedFields = [
            'senior-contact-first-name',
            'senior-contact-last-name',
            'senior-contact-role',
            'senior-contact-email',
            'senior-contact-phone',
            'senior-contact-communication-needs'
        ];

        expect(seniorContactFn({})).toEqual(seniorContactDefaultFields);
        expect(
            seniorContactFn({ 'organisation-type': ORGANISATION_TYPES.SCHOOL })
        ).toEqual(seniorContactReducedFields);
        expect(
            seniorContactFn({
                'organisation-type': ORGANISATION_TYPES.STATUTORY_BODY
            })
        ).toEqual(seniorContactReducedFields);
    });
});
