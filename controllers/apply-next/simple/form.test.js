/* eslint-env jest */
'use strict';
const { map, flatMap } = require('lodash');
const faker = require('faker');
const moment = require('moment');
const Joi = require('joi');

const { mockFullForm, mockAddress, mockBudget } = require('./mocks');
const formBuilder = require('./form');
const { allFields } = formBuilder({ locale: 'en' });

describe('fields', () => {
    const toDateParts = dt => ({
        day: dt.get('date'),
        month: dt.get('month') + 1,
        year: dt.get('year')
    });

    function assertValid(field, val) {
        const { error } = field.schema.validate(val);
        expect(error).toBeNull();
    }

    describe('projectName', () => {
        test('valid', () => {
            assertValid(allFields.projectName, faker.lorem.words(5));
        });

        test('invalid', () => {
            const { error } = allFields.projectName.schema.validate('');
            expect(error.message).toContain('not allowed to be empty');
        });
    });

    describe('projectCountry', () => {
        test('valid', () => {
            assertValid(
                allFields.projectCountry,
                faker.random.arrayElement(['england', 'northern-ireland', 'scotland', 'wales'])
            );
        });

        test('invalid', () => {
            const { error } = allFields.projectCountry.schema.validate('not-a-country');
            expect(error.message).toContain('must be one of [england, northern-ireland, scotland, wales]');
        });
    });

    describe('projectStartDate', () => {
        test('valid', () => {
            assertValid(allFields.projectStartDate, toDateParts(moment().add(12, 'weeks')));
        });

        test('missing', () => {
            const { error } = allFields.projectStartDate.schema.validate(null);
            expect(error.message).toContain('must be an object');
        });

        test('invalid', () => {
            const { error } = allFields.projectStartDate.schema.validate({ day: 31, month: 2, year: 2030 });
            expect(error.message).toContain('contains an invalid value');
        });

        test('less than 12 weeks in the future', () => {
            const dt = moment().add(6, 'weeks');
            const { error } = allFields.projectStartDate.schema.validate(toDateParts(dt));
            expect(error.message).toContain('Date must be at least');
        });
    });

    describe('projectPostcode', () => {
        test('valid', () => {
            assertValid(allFields.projectPostcode, 'B15 1TR');
        });

        test('missing', () => {
            const { error } = allFields.projectPostcode.schema.validate(null);
            expect(error.message).toContain('must be a string');
        });

        test('invalid', () => {
            const { error } = allFields.projectPostcode.schema.validate('not a postcode');
            expect(error.message).toContain('fails to match the required pattern');
        });
    });

    describe('yourIdeaProject', () => {
        test('valid', () => {
            assertValid(allFields.yourIdeaProject, faker.lorem.words(250));
        });

        test('at least 50 words', () => {
            const { error } = allFields.yourIdeaProject.schema.validate(faker.lorem.words(49));
            expect(error.message).toContain('must have at least 50 words');
        });

        test('no more than 300 words', () => {
            const { error } = allFields.yourIdeaProject.schema.validate(faker.lorem.words(301));
            expect(error.message).toContain('must have less than 300 words');
        });
    });

    describe('yourIdeaPriorities', () => {
        test('valid', () => {
            assertValid(allFields.yourIdeaPriorities, faker.lorem.words(100));
        });

        test('at least 50 words', () => {
            const { error } = allFields.yourIdeaPriorities.schema.validate(faker.lorem.words(49));
            expect(error.message).toContain('must have at least 50 words');
        });

        test('no more than 150 words', () => {
            const { error } = allFields.yourIdeaPriorities.schema.validate(faker.lorem.words(151));
            expect(error.message).toContain('must have less than 150 words');
        });
    });

    describe('yourIdeaCommunity', () => {
        test('valid', () => {
            assertValid(allFields.yourIdeaCommunity, faker.lorem.words(150));
        });

        test('at least 50 words', () => {
            const { error } = allFields.yourIdeaCommunity.schema.validate(faker.lorem.words(49));
            expect(error.message).toContain('must have at least 50 words');
        });

        test('no more than 150 words', () => {
            const { error } = allFields.yourIdeaCommunity.schema.validate(faker.lorem.words(201));
            expect(error.message).toContain('must have less than 200 words');
        });
    });

    describe('projectBudget', () => {
        test('valid', () => {
            assertValid(allFields.projectBudget, mockBudget());
        });

        test('over budget', () => {
            const { error } = allFields.projectBudget.schema.validate(
                new Array(10).fill(null).map(() => {
                    return {
                        item: faker.lorem.words(5),
                        cost: 1100
                    };
                })
            );
            expect(error.message).toContain('over maximum budget');
        });

        test('invalid', () => {
            const { error } = allFields.projectBudget.schema.validate([{ item: faker.lorem.words(5) }]);
            expect(error.message).toContain('"cost" is required');
        });

        test('missing', () => {
            const { error } = allFields.projectBudget.schema.validate([]);
            expect(error.message).toContain('must contain at least 1 items');
        });
    });

    describe('projectTotalCosts', () => {
        test('valid', () => {
            assertValid(allFields.projectTotalCosts, 1000);
        });

        test('missing', () => {
            const { error } = allFields.projectTotalCosts.schema.validate();
            expect(error.message).toContain('is required');
        });

        test('invalid', () => {
            const { error } = allFields.projectTotalCosts.schema.validate(Infinity);
            expect(error.message).toContain('contains an invalid value');
        });

        test('under project budget', () => {
            const schemaWithProjectBudget = Joi.object({
                'project-budget': allFields.projectBudget.schema,
                'project-total-costs': allFields.projectTotalCosts.schema
            });

            const { error } = Joi.validate(
                {
                    'project-budget': [
                        { item: faker.lorem.words(5), cost: 1100 },
                        { item: faker.lorem.words(5), cost: 1100 }
                    ],
                    'project-total-costs': 1000
                },
                schemaWithProjectBudget
            );

            expect(error.message).toContain('under project budget total');
        });

        test('minimum of project budget', () => {
            const schemaWithProjectBudget = Joi.object({
                'project-budget': allFields.projectBudget.schema,
                'project-total-costs': allFields.projectTotalCosts.schema
            });

            const { error } = Joi.validate(
                {
                    'project-budget': [
                        { item: faker.lorem.words(5), cost: 1100 },
                        { item: faker.lorem.words(5), cost: 1100 }
                    ],
                    'project-total-costs': 2200
                },
                schemaWithProjectBudget
            );

            expect(error).toBeNull();
        });
    });

    describe('organisationLegalName', () => {
        test('valid', () => {
            assertValid(allFields.organisationLegalName, faker.company.companyName());
        });

        test('missing', () => {
            const { error } = allFields.organisationLegalName.schema.validate();
            expect(error.message).toContain('is required');
        });

        test('invalid', () => {
            const { error } = allFields.organisationLegalName.schema.validate(Infinity);
            expect(error.message).toContain('must be a string');
        });
    });

    describe('organisationAlias', () => {
        test('optional field', () => {
            assertValid(allFields.organisationAlias, undefined);
            assertValid(allFields.organisationAlias, faker.company.companyName());
        });

        test('invalid', () => {
            const { error } = allFields.organisationAlias.schema.validate(Infinity);
            expect(error.message).toContain('must be a string');
        });
    });

    describe('organisationAddress', () => {
        test('valid', () => {
            assertValid(allFields.organisationAddress, mockAddress());
        });

        test('missing', () => {
            const { error } = allFields.organisationAddress.schema.validate();
            expect(error.message).toContain('is required');
        });

        test('partial address fields', () => {
            const { error } = allFields.organisationAddress.schema.validate({
                'building-street': '3 Embassy Drive',
                'county': 'West Midlands',
                'postcode': 'B15 1TR'
            });
            expect(error.message).toEqual('child "town-city" fails because ["town-city" is required]');
        });

        test('invalid postcode', () => {
            const { error } = allFields.organisationAddress.schema.validate({
                ...mockAddress(),
                ...{ postcode: 'not a postcode' }
            });
            expect(error.message).toContain('fails to match the required pattern');
        });
    });

    describe('organisationType', () => {
        test('valid', () => {
            assertValid(allFields.organisationType, 'unregistered-vco');
        });

        test('invalid', () => {
            const { error } = allFields.organisationType.schema.validate('not-an-option');
            expect(error.message).toContain(
                'must be one of [unregistered-vco, unincorporated-registered-charity, charitable-incorporated-organisation, not-for-profit-company, school, statutory-body]'
            );
        });

        test('missing', () => {
            const { error } = allFields.organisationType.schema.validate();
            expect(error.message).toContain('is required');
        });
    });

    describe('companyNumber', () => {
        test('valid', () => {
            assertValid(allFields.companyNumber, 'CE002712');
        });

        test('optional by default', () => {
            const { error } = allFields.companyNumber.schema.validate();
            expect(error).toBeNull();
        });

        test('conditionally required', () => {
            const { error } = Joi.validate(
                { 'organisation-type': 'not-for-profit-company' },
                {
                    'organisation-type': allFields.organisationType.schema,
                    'company-number': allFields.companyNumber.schema
                }
            );

            expect(error.message).toContain('is required');
        });
    });

    describe('charityNumber', () => {
        test('valid', () => {
            assertValid(allFields.charityNumber, '1160580');
        });

        test('optional by default', () => {
            assertValid(allFields.charityNumber);
        });

        test('required if unincorporated registered charity', () => {
            const schemaWithOrgType = {
                'organisation-type': allFields.organisationType.schema,
                'charity-number': allFields.charityNumber.schema
            };

            const { error } = Joi.validate(
                { 'organisation-type': 'unincorporated-registered-charity' },
                schemaWithOrgType
            );

            expect(error.message).toContain('is required');
        });

        test('required if cio', () => {
            const schemaWithOrgType = {
                'organisation-type': allFields.organisationType.schema,
                'charity-number': allFields.charityNumber.schema
            };

            const { error } = Joi.validate(
                { 'organisation-type': 'charitable-incorporated-organisation' },
                schemaWithOrgType
            );

            expect(error.message).toContain('is required');
        });

        test('optional when a not for profit company', () => {
            const schemaWithOrgType = {
                'organisation-type': allFields.organisationType.schema,
                'charity-number': allFields.charityNumber.schema
            };

            const { error } = Joi.validate({ 'organisation-type': 'not-for-profit-company' }, schemaWithOrgType);
            expect(error).toBeNull();
        });
    });

    describe('accountingYearDate', () => {
        test('valid', () => {
            assertValid(allFields.accountingYearDate, { day: 12, month: 2 });
        });

        test('missing', () => {
            const { error } = allFields.accountingYearDate.schema.validate(null);
            expect(error.message).toContain('must be an object');
        });

        test('invalid', () => {
            const { error } = allFields.accountingYearDate.schema.validate({ day: 31, month: 2 });
            expect(error.message).toContain('contains an invalid value');
        });
    });

    describe('totalIncomeYear', () => {
        test('valid', () => {
            assertValid(allFields.totalIncomeYear, 1000);
        });

        test('missing', () => {
            const { error } = allFields.totalIncomeYear.schema.validate();
            expect(error.message).toContain('is required');
        });

        test('invalid', () => {
            const { error } = allFields.totalIncomeYear.schema.validate(Infinity);
            expect(error.message).toContain('contains an invalid value');
        });
    });

    function testContactNamePart(field) {
        test('valid', () => {
            assertValid(field, faker.name.findName());
        });

        test('invalid', () => {
            const { error } = field.schema.validate(Infinity);
            expect(error.message).toContain('must be a string');
        });

        test('missing', () => {
            const { error } = field.schema.validate();
            expect(error.message).toContain('is required');
        });
    }

    function testContactAddress(field) {
        test('valid', () => {
            assertValid(field, mockAddress());
        });

        test('missing', () => {
            const { error } = field.schema.validate();
            expect(error.message).toContain('is required');
        });

        test('partial address fields', () => {
            const { error } = field.schema.validate({
                'building-street': '3 Embassy Drive',
                'county': 'West Midlands',
                'postcode': 'B15 1TR'
            });
            expect(error.message).toEqual('child "town-city" fails because ["town-city" is required]');
        });

        test('invalid postcode', () => {
            const { error } = field.schema.validate({
                'building-street': '3 Embassy Drive',
                'town-city': 'Edgbaston, Birmingham',
                'county': 'West Midlands',
                'postcode': 'not a postcode'
            });
            expect(error.message).toContain('fails to match the required pattern');
        });

        test('not required if organisation-type is a school or statutory-body', () => {
            const schemaWithOrgType = {
                'organisation-type': allFields.organisationType.schema,
                'main-contact-dob': field.schema
            };

            const { error } = Joi.validate(
                {
                    'organisation-type': 'school',
                    'main-contact-dob': null
                },
                schemaWithOrgType
            );

            expect(error).toBeNull();
        });
    }

    function testContactEmail(field) {
        test('valid', () => {
            assertValid(field, faker.internet.exampleEmail());
        });

        test('invalid', () => {
            const { error } = field.schema.validate(Infinity);
            expect(error.message).toContain('must be a string');
        });

        test('missing', () => {
            const { error } = field.schema.validate();
            expect(error.message).toContain('is required');
        });
    }

    function testContactPhone(field) {
        test('valid', () => {
            assertValid(field, '0345 4 10 20 30');
        });

        test('invalid', () => {
            const { error } = field.schema.validate('not a phone number');
            expect(error.message).toContain('did not seem to be a phone number');
        });

        test('missing', () => {
            const { error } = field.schema.validate();
            expect(error.message).toContain('is required');
        });
    }

    function testContactCommunicationNeeds(field) {
        test('valid', () => {
            assertValid(field, 'audiotape');
        });

        test('invalid', () => {
            const { error } = field.schema.validate('invalid');
            expect(error.message).toContain(
                'must be one of [audiotape, braille, disk, large-print, letter, sign-language, text-relay]'
            );
        });

        test('optional', () => {
            const { error } = field.schema.validate();
            expect(error).toBeNull();
        });
    }

    describe('mainContactName', () => {
        testContactNamePart(allFields.mainContactFirstName);
        testContactNamePart(allFields.mainContactLastName);
    });

    describe('mainContactDob', () => {
        test('must be at least 16 years old', () => {
            const randomDob = moment().subtract(
                faker.random.number({
                    min: 16,
                    max: 100
                }),
                'years'
            );
            assertValid(allFields.mainContactDob, toDateParts(randomDob));

            const invalidDob = moment().subtract(15, 'years');
            const { error } = allFields.mainContactDob.schema.validate(toDateParts(invalidDob));
            expect(error.message).toContain('Must be at least 16 years old');
        });

        test('not required if organisation-type is a school or statutory-body', () => {
            const { error } = Joi.validate(
                { 'organisation-type': 'school' },
                {
                    'organisation-type': allFields.organisationType.schema,
                    'main-contact-dob': allFields.mainContactDob.schema
                }
            );

            expect(error).toBeNull();
        });
    });

    describe('seniorContactAddress', () => {
        testContactAddress(allFields.seniorContactAddress);
    });

    describe('seniorContactEmail', () => {
        testContactEmail(allFields.seniorContactEmail);
    });

    describe('seniorContactPhone', () => {
        testContactPhone(allFields.seniorContactPhone);
    });

    describe('seniorContactCommunicationNeeds', () => {
        testContactCommunicationNeeds(allFields.seniorContactCommunicationNeeds);
    });

    describe('seniorContactName', () => {
        testContactNamePart(allFields.seniorContactFirstName);
        testContactNamePart(allFields.seniorContactLastName);
    });

    describe('seniorContactRole', () => {
        test('valid', () => {
            assertValid(allFields.seniorContactRole, 'chair');
        });

        test('invalid', () => {
            const { error } = allFields.seniorContactRole.schema.validate(Infinity);
            expect(error.message).toContain('must be a string');
        });

        test('missing', () => {
            const { error } = allFields.seniorContactRole.schema.validate();
            expect(error.message).toContain('is required');
        });
    });

    describe('seniorContactDob', () => {
        test('must be at least 18 years old', () => {
            const randomDob = moment().subtract(
                faker.random.number({
                    min: 18,
                    max: 100
                }),
                'years'
            );
            assertValid(allFields.seniorContactDob, toDateParts(randomDob));

            const invalidDob = moment().subtract(17, 'years');
            const { error } = allFields.seniorContactDob.schema.validate(toDateParts(invalidDob));
            expect(error.message).toContain('Must be at least 18 years old');
        });

        test('not required if organisation-type is a school or statutory-body', () => {
            const { error } = Joi.validate(
                { 'organisation-type': 'school' },
                {
                    'organisation-type': allFields.organisationType.schema,
                    'main-contact-dob': allFields.seniorContactDob.schema
                }
            );

            expect(error).toBeNull();
        });
    });

    describe('seniorContactAddress', () => {
        testContactAddress(allFields.seniorContactAddress);
    });

    describe('seniorContactEmail', () => {
        testContactEmail(allFields.seniorContactEmail);
    });

    describe('seniorContactPhone', () => {
        testContactPhone(allFields.seniorContactPhone);
    });

    describe('seniorContactCommunicationNeeds', () => {
        testContactCommunicationNeeds(allFields.seniorContactCommunicationNeeds);
    });

    describe('bankAccountName', () => {
        test('valid', () => {
            assertValid(allFields.bankAccountName, faker.company.companyName());
        });

        test('missing', () => {
            const { error } = allFields.bankAccountName.schema.validate();
            expect(error.message).toContain('is required');
        });

        test('invalid', () => {
            const { error } = allFields.bankAccountName.schema.validate(Infinity);
            expect(error.message).toContain('must be a string');
        });
    });

    describe('bankSortCode', () => {
        test('valid', () => {
            assertValid(allFields.bankAccountName, '108800');
        });

        test('missing', () => {
            const { error } = allFields.bankAccountName.schema.validate();
            expect(error.message).toContain('is required');
        });

        test('invalid', () => {
            const { error } = allFields.bankAccountName.schema.validate(Infinity);
            expect(error.message).toContain('must be a string');
        });
    });

    describe('bankAccountNumber', () => {
        test('valid', () => {
            assertValid(allFields.bankAccountNumber, '00012345');
        });

        test('missing', () => {
            const { error } = allFields.bankAccountNumber.schema.validate();
            expect(error.message).toContain('is required');
        });

        test('invalid', () => {
            const { error } = allFields.bankAccountNumber.schema.validate(Infinity);
            expect(error.message).toContain('must be a string');
        });
    });

    describe('bankBuildingSocietyNumber', () => {
        test('optional field', () => {
            assertValid(allFields.bankBuildingSocietyNumber);
            assertValid(allFields.bankBuildingSocietyNumber, '1234566');
        });

        test('invalid', () => {
            const { error } = allFields.bankBuildingSocietyNumber.schema.validate(Infinity);
            expect(error.message).toContain('must be a string');
        });
    });

    describe('bankStatement', () => {
        test('valid', () => {
            assertValid(allFields.bankStatement, 'example.pdf');
        });

        test('missing', () => {
            const { error } = allFields.bankStatement.schema.validate();
            expect(error.message).toContain('is required');
        });

        test('invalid', () => {
            const { error } = allFields.bankStatement.schema.validate(Infinity);
            expect(error.message).toContain('must be a string');
        });
    });
});

describe('form model', () => {
    function validate(mock) {
        const form = formBuilder({ locale: 'en' });
        return form.schema.validate(mock, {
            abortEarly: false,
            stripUnknown: true
        });
    }

    test('invalid empty form', () => {
        const validationResult = validate({});
        expect(validationResult.error).toBeInstanceOf(Error);
    });

    test('validate full form', () => {
        const mock = mockFullForm({
            country: 'england',
            organisationType: 'unregistered-vco'
        });

        const validationResult = validate(mock);
        expect(validationResult.error).toBeNull();
    });

    test('validate full form with company number', () => {
        const mockWithoutCompanyNumber = mockFullForm({
            country: 'england',
            organisationType: 'not-for-profit-company'
        });

        expect(validate(mockWithoutCompanyNumber).error).toBeInstanceOf(Error);

        const mockWithCompanyNumber = mockFullForm({
            country: 'england',
            organisationType: 'not-for-profit-company',
            companyNumber: '123456789'
        });
        expect(validate(mockWithCompanyNumber).error).toBeNull();
    });

    test('validate full form with charity number', () => {
        const mockWithoutCharityNumber = mockFullForm({
            country: 'england',
            organisationType: 'not-for-profit-company'
        });

        expect(validate(mockWithoutCharityNumber).error).toBeInstanceOf(Error);

        const mockWithCharityNumber = mockFullForm({
            country: 'england',
            organisationType: 'unincorporated-registered-charity',
            charityNumber: '123456789'
        });

        expect(validate(mockWithCharityNumber).error).toBeNull();
    });

    test('return conditional role choices based on organisation type', () => {
        const mappings = {
            '': [],
            'unregistered-vco': ['chair', 'vice-chair', 'secretary', 'treasurer'],
            'unincorporated-registered-charity': ['trustee'],
            'charitable-incorporated-organisation': ['trustee'],
            'not-for-profit-company': ['company-director', 'company-secretary'],
            'school': ['head-teacher', 'chancellor', 'vice-chancellor'],
            'statutory-body': ['parish-clerk', 'chief-executive']
        };

        map(mappings, (expected, type) => {
            const form = formBuilder({
                locale: 'en',
                data: { 'organisation-type': type }
            });
            expect(form.allFields.seniorContactRole.options.map(o => o.value)).toEqual(expected);
        });
    });

    function fieldNamesFor(sectionSlug, stepTitle) {
        return function(data) {
            const form = formBuilder({
                locale: 'en',
                data: data
            });

            const section = form.sections.find(s => s.slug === sectionSlug);
            const step = section.steps.find(s => s.title === stepTitle);
            return map(flatMap(step.fieldsets, 'fields'), f => f.name);
        };
    }

    test('registration numbers shown based on organisation type', () => {
        const fieldNamesFn = fieldNamesFor('organisation', 'Registration numbers');

        expect(fieldNamesFn({})).toEqual([]);

        const mappings = {
            'unincorporated-registered-charity': ['charity-number'],
            'charitable-incorporated-organisation': ['charity-number'],
            'not-for-profit-company': ['company-number', 'charity-number']
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
        expect(mainContactFn({ 'organisation-type': 'school' })).toEqual(mainContactReducedFields);
        expect(mainContactFn({ 'organisation-type': 'statutory-body' })).toEqual(mainContactReducedFields);

        const seniorContactFn = fieldNamesFor('senior-contact', 'Senior contact');

        const seniorContactDefaultFields = [
            'senior-contact-first-name',
            'senior-contact-last-name',
            'senior-contact-role',
            'senior-contact-dob',
            'senior-contact-address',
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
        expect(seniorContactFn({ 'organisation-type': 'school' })).toEqual(seniorContactReducedFields);
        expect(seniorContactFn({ 'organisation-type': 'statutory-body' })).toEqual(seniorContactReducedFields);
    });
});
