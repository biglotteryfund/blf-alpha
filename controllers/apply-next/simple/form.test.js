/* eslint-env jest */
'use strict';
const { map } = require('lodash');
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

    describe('projectName', () => {
        test('valid', () => {
            const { error } = allFields.projectName.schema.validate(faker.lorem.words(5));
            expect(error).toBeNull();
        });

        test('invalid', () => {
            const { error } = allFields.projectName.schema.validate('');
            expect(error.message).toContain('not allowed to be empty');
        });
    });

    describe('projectCountry', () => {
        test('valid', () => {
            const { error } = allFields.projectCountry.schema.validate(
                faker.random.arrayElement(['england', 'northern-ireland', 'scotland', 'wales'])
            );
            expect(error).toBeNull();
        });

        test('invalid', () => {
            const { error } = allFields.projectCountry.schema.validate('not-a-country');
            expect(error.message).toContain('must be one of [england, northern-ireland, scotland, wales]');
        });
    });

    describe('projectStartDate', () => {
        test('valid', () => {
            const dt = moment().add(12, 'weeks');
            const { error } = allFields.projectStartDate.schema.validate(toDateParts(dt));
            expect(error).toBeNull();
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
            const { error } = allFields.projectPostcode.schema.validate('B15 1TR');
            expect(error).toBeNull();
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
            const { error } = allFields.yourIdeaProject.schema.validate(faker.lorem.words(250));
            expect(error).toBeNull();
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
            const { error } = allFields.yourIdeaPriorities.schema.validate(faker.lorem.words(100));
            expect(error).toBeNull();
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
            const { error } = allFields.yourIdeaCommunity.schema.validate(faker.lorem.words(150));
            expect(error).toBeNull();
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
            const { error } = allFields.projectBudget.schema.validate(mockBudget());
            expect(error).toBeNull();
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
            const { error } = allFields.projectTotalCosts.schema.validate(1000);
            expect(error).toBeNull();
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
            const { error } = allFields.organisationLegalName.schema.validate(faker.company.companyName());
            expect(error).toBeNull();
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
        test('valid', () => {
            const { error } = allFields.organisationAlias.schema.validate(faker.company.companyName());
            expect(error).toBeNull();
        });

        test('optional', () => {
            const { error } = allFields.organisationAlias.schema.validate();
            expect(error).toBeNull();
        });

        test('invalid', () => {
            const { error } = allFields.organisationAlias.schema.validate(Infinity);
            expect(error.message).toContain('must be a string');
        });
    });

    describe('organisationAddress', () => {
        test('valid', () => {
            const { error } = allFields.organisationAddress.schema.validate(mockAddress());
            expect(error).toBeNull();
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
            const { error } = allFields.organisationType.schema.validate('unregistered-vco');
            expect(error).toBeNull();
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
            const { error } = allFields.companyNumber.schema.validate('CE002712');
            expect(error).toBeNull();
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

            expect(allFields.companyNumber.shouldShow()).toBeFalsy();
            expect(allFields.companyNumber.shouldShow({ 'organisation-type': 'not-for-profit-company' })).toBeTruthy();
            expect(allFields.companyNumber.shouldShow({ 'organisation-type': 'school' })).toBeFalsy();
        });
    });

    describe('charityNumber', () => {
        test('valid', () => {
            const { error } = allFields.charityNumber.schema.validate('1160580');
            expect(error).toBeNull();
        });

        test('optional by default', () => {
            const { error } = allFields.charityNumber.schema.validate();
            expect(error).toBeNull();
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

            expect(allFields.charityNumber.shouldShow()).toBeFalsy();
            expect(
                allFields.charityNumber.shouldShow({ 'organisation-type': 'unincorporated-registered-charity' })
            ).toBeTruthy();
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

            expect(allFields.charityNumber.shouldShow()).toBeFalsy();
            expect(
                allFields.charityNumber.shouldShow({ 'organisation-type': 'charitable-incorporated-organisation' })
            ).toBeTruthy();
        });

        test('shown but optional when a not for profit company', () => {
            const schemaWithOrgType = {
                'organisation-type': allFields.organisationType.schema,
                'charity-number': allFields.charityNumber.schema
            };

            const { error } = Joi.validate({ 'organisation-type': 'not-for-profit-company' }, schemaWithOrgType);

            expect(error).toBeNull();

            expect(allFields.charityNumber.shouldShow()).toBeFalsy();
            expect(allFields.charityNumber.shouldShow({ 'organisation-type': 'not-for-profit-company' })).toBeTruthy();
        });
    });

    describe('accountingYearDate', () => {
        test('valid', () => {
            const { error } = allFields.accountingYearDate.schema.validate({ day: 12, month: 2 });
            expect(error).toBeNull();
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
            const { error } = allFields.totalIncomeYear.schema.validate(1000);
            expect(error).toBeNull();
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
            const { error } = field.schema.validate(faker.name.findName());
            expect(error).toBeNull();
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
            const { error } = field.schema.validate({
                'building-street': '3 Embassy Drive',
                'town-city': 'Edgbaston, Birmingham',
                'county': 'West Midlands',
                'postcode': 'B15 1TR'
            });
            expect(error).toBeNull();
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

            expect(field.shouldShow()).toBeTruthy();
            expect(field.shouldShow({ 'organisation-type': 'unregistered-vco' })).toBeTruthy();
            expect(field.shouldShow({ 'organisation-type': 'school' })).toBeFalsy();
            expect(field.shouldShow({ 'organisation-type': 'statutory-body' })).toBeFalsy();
        });
    }

    function testContactEmail(field) {
        test('valid', () => {
            const { error } = field.schema.validate(faker.internet.exampleEmail());
            expect(error).toBeNull();
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
            const { error } = field.schema.validate('0345 4 10 20 30');
            expect(error).toBeNull();
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
            const { error } = field.schema.validate('audiotape');
            expect(error).toBeNull();
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
        test('valid', () => {
            const dt = moment().subtract(16, 'years');
            const { error } = allFields.mainContactDob.schema.validate(toDateParts(dt));
            expect(error).toBeNull();
        });

        test('at least 16 years old', () => {
            const dt = moment().subtract(15, 'years');
            const { error } = allFields.mainContactDob.schema.validate(toDateParts(dt));
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

            expect(allFields.mainContactDob.shouldShow()).toBeTruthy();
            expect(allFields.mainContactDob.shouldShow({ 'organisation-type': 'unregistered-vco' })).toBeTruthy();
            expect(allFields.mainContactDob.shouldShow({ 'organisation-type': 'school' })).toBeFalsy();
            expect(allFields.mainContactDob.shouldShow({ 'organisation-type': 'statutory-body' })).toBeFalsy();
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
        const field = allFields.seniorContactRole;
        test('valid', () => {
            const { error } = field.schema.validate('chair');
            expect(error).toBeNull();
        });

        test('invalid', () => {
            const { error } = field.schema.validate(Infinity);
            expect(error.message).toContain('must be a string');
        });

        test('missing', () => {
            const { error } = field.schema.validate();
            expect(error.message).toContain('is required');
        });
    });

    describe('seniorContactDob', () => {
        test('valid', () => {
            const dt = moment().subtract(18, 'years');
            const { error } = allFields.seniorContactDob.schema.validate(toDateParts(dt));
            expect(error).toBeNull();
        });

        test('at least 18 years old', () => {
            const dt = moment().subtract(17, 'years');
            const { error } = allFields.seniorContactDob.schema.validate(toDateParts(dt));
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

            expect(allFields.seniorContactDob.shouldShow()).toBeTruthy();
            expect(allFields.seniorContactDob.shouldShow({ 'organisation-type': 'unregistered-vco' })).toBeTruthy();
            expect(allFields.seniorContactDob.shouldShow({ 'organisation-type': 'school' })).toBeFalsy();
            expect(allFields.seniorContactDob.shouldShow({ 'organisation-type': 'statutory-body' })).toBeFalsy();
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
            const { error } = allFields.bankAccountName.schema.validate(faker.company.companyName());
            expect(error).toBeNull();
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
            const { error } = allFields.bankAccountName.schema.validate('108800');
            expect(error).toBeNull();
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
            const { error } = allFields.bankAccountNumber.schema.validate('00012345');
            expect(error).toBeNull();
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
        test('valid', () => {
            const { error } = allFields.bankBuildingSocietyNumber.schema.validate('1234566');
            expect(error).toBeNull();
        });

        test('optional', () => {
            const { error } = allFields.bankBuildingSocietyNumber.schema.validate();
            expect(error).toBeNull();
        });

        test('invalid', () => {
            const { error } = allFields.bankBuildingSocietyNumber.schema.validate(Infinity);
            expect(error.message).toContain('must be a string');
        });
    });

    describe('bankStatement', () => {
        test('valid', () => {
            const { error } = allFields.bankStatement.schema.validate('example.pdf');
            expect(error).toBeNull();
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
});
