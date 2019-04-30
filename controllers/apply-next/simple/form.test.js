/* eslint-env jest */
'use strict';
const { flatMap, map, range, times } = require('lodash');
const faker = require('faker');
const moment = require('moment');
const Joi = require('joi');

const { ORGANISATION_TYPES } = require('./constants');
const validateModel = require('../lib/validate-model');

function toDateParts(dt) {
    return {
        day: dt.date(),
        month: dt.month() + 1,
        year: dt.year()
    };
}

function mockDateOfBirth() {
    const dt = moment().subtract(faker.random.number({ min: 18, max: 75 }), 'years');
    return toDateParts(dt);
}

function mockAddress() {
    return {
        'building-street': faker.address.streetAddress(),
        'town-city': faker.address.city(),
        'county': faker.address.county(),
        'postcode': 'B15 1TR'
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
    country,
    organisationType,
    companyNumber = null,
    charityNumber = null,
    educationNumber = null
}) {
    return {
        'project-name': faker.lorem.words(5),
        'project-country': country,
        'project-start-date': toDateParts(moment().add(12, 'weeks')),
        'project-postcode': 'B15 1TR',
        'your-idea-project': faker.lorem.words(250),
        'your-idea-priorities': faker.lorem.words(100),
        'your-idea-community': faker.lorem.words(150),
        'project-budget': mockBudget(),
        'project-total-costs': faker.random.number({ min: 5000, max: 10000 }),
        'beneficiaries-number-of-people': faker.random.number({ min: 500, max: 100000 }),
        'beneficiaries-location-check': 'yes',
        'beneficiaries-local-authority': 'aberdeenshire',
        'beneficiaries-location-description': faker.address.city(),
        'organisation-legal-name': faker.company.companyName(),
        'organisation-address': mockAddress(),
        'organisation-type': organisationType,
        'company-number': companyNumber,
        'charity-number': charityNumber,
        'education-number': educationNumber,
        'accounting-year-date': { day: 1, month: 3 },
        'total-income-year': faker.random.number({ min: 10000, max: 1000000 }),
        'main-contact-first-name': faker.name.firstName(),
        'main-contact-last-name': faker.name.lastName(),
        'main-contact-dob': mockDateOfBirth(),
        'main-contact-address': mockAddress(),
        'main-contact-address-history': {
            'current-address-meets-minimum': 'no',
            'previous-address': mockAddress()
        },
        'main-contact-email': faker.internet.exampleEmail(),
        'main-contact-phone': '0345 4 10 20 30',
        'senior-contact-first-name': faker.name.firstName(),
        'senior-contact-last-name': faker.name.lastName(),
        'senior-contact-role': faker.lorem.words(5),
        'senior-contact-dob': mockDateOfBirth(),
        'senior-contact-address': mockAddress(),
        'senior-contact-address-history': {
            'current-address-meets-minimum': 'yes'
        },
        'senior-contact-email': faker.internet.exampleEmail(),
        'senior-contact-phone': '020 7211 1888',
        'bank-account-name': faker.company.companyName(),
        'bank-sort-code': '108800',
        'bank-account-number': '00012345',
        'bank-building-society-number': '108800',
        'bank-statement': faker.system.fileName()
    };
}

const formBuilder = require('./form');
const { allFields } = formBuilder({ locale: 'en' });

describe('fields', () => {
    function assertValid(field, value) {
        const { error } = field.schema.validate(value);
        expect(error).toBeNull();
    }

    function assertErrorContains(field, value, messagePart) {
        const { error } = field.schema.validate(value);
        expect(error.message).toContain(messagePart);
    }

    describe('projectName', () => {
        test('valididate project name', () => {
            assertValid(allFields.projectName, faker.lorem.words(5));
            assertErrorContains(allFields.projectName, '', 'not allowed to be empty');
        });
    });

    describe('projectCountry', () => {
        test('valididate project country', () => {
            assertValid(
                allFields.projectCountry,
                faker.random.arrayElement(['england', 'northern-ireland', 'scotland', 'wales'])
            );
            assertErrorContains(
                allFields.projectCountry,
                'not-a-country',
                'must be one of [england, northern-ireland, scotland, wales]'
            );
        });
    });

    describe('projectStartDate', () => {
        test('must be a valid date', () => {
            assertValid(allFields.projectStartDate, toDateParts(moment().add(12, 'weeks')));
            assertErrorContains(allFields.projectStartDate, null, 'must be an object');
            assertErrorContains(
                allFields.projectStartDate,
                { day: 31, month: 2, year: 2030 },
                'contains an invalid value'
            );
        });

        test('must be at least 12 weeks in the future', () => {
            const dt = moment().add(6, 'weeks');
            const { error } = allFields.projectStartDate.schema.validate(toDateParts(dt));
            expect(error.message).toContain('Date must be at least');
        });
    });

    describe('projectPostcode', () => {
        test('must be a valid UK postcode', () => {
            assertValid(allFields.projectPostcode, 'B15 1TR');
            assertErrorContains(allFields.projectPostcode, null, 'must be a string');
            assertErrorContains(allFields.projectPostcode, 'not a postcode', 'fails to match the required pattern');
        });
    });

    function testWordCountRange(field, min, max) {
        assertErrorContains(field, null, 'must be a string');

        const wordCountIncrement = faker.random.number({ min: 25, max: 100 });
        range(min, max, wordCountIncrement).forEach(wordCount => {
            assertValid(field, faker.lorem.words(wordCount));
        });

        assertErrorContains(field, faker.lorem.words(49), `must have at least ${min} words`);
        assertErrorContains(field, faker.lorem.words(301), `must have less than ${max} words`);
    }

    describe('yourIdeaProject', () => {
        test('must be between 50 and 300 words', () => {
            testWordCountRange(allFields.yourIdeaProject, 50, 300);
        });
    });

    describe('yourIdeaPriorities', () => {
        test('must be between 50 and 150 words', () => {
            testWordCountRange(allFields.yourIdeaPriorities, 50, 150);
        });
    });

    describe('yourIdeaCommunity', () => {
        test('must be between 50 and 200 words', () => {
            testWordCountRange(allFields.yourIdeaCommunity, 50, 200);
        });
    });

    describe('projectBudget', () => {
        test('must provide a valid budget', () => {
            assertValid(allFields.projectBudget, mockBudget());
        });

        test('must have at least one budget item', () => {
            assertErrorContains(allFields.projectBudget, [], 'must contain at least 1 items');
        });

        test('total amount requested must not exceed £10,000', () => {
            const budget = times(10, () => ({ item: faker.lorem.words(5), cost: 1100 }));
            assertErrorContains(allFields.projectBudget, budget, 'over maximum budget');
        });

        test('all items must contain both a description and a cost', () => {
            const budget = times(5, () => ({ item: faker.lorem.words(5) }));
            assertErrorContains(allFields.projectBudget, budget, '"cost" is required');
        });
    });

    describe('projectTotalCosts', () => {
        test('validate project total costs', () => {
            assertValid(allFields.projectTotalCosts, 1000);
            assertErrorContains(allFields.projectTotalCosts, undefined, 'is required');
            assertErrorContains(allFields.projectTotalCosts, Infinity, 'contains an invalid value');
        });

        test('must be at least value of project budget', () => {
            const schemaWithProjectBudget = Joi.object({
                'project-budget': allFields.projectBudget.schema,
                'project-total-costs': allFields.projectTotalCosts.schema
            });

            const budget = times(2, () => ({ item: faker.lorem.words(5), cost: 1100 }));

            const validationResultValid = Joi.validate(
                { 'project-budget': budget, 'project-total-costs': 2200 },
                schemaWithProjectBudget
            );
            expect(validationResultValid.error).toBeNull();

            const validationResultInvalid = Joi.validate(
                { 'project-budget': budget, 'project-total-costs': 1000 },
                schemaWithProjectBudget
            );
            expect(validationResultInvalid.error.message).toContain('under project budget total');
        });
    });

    describe('beneficiariesNumberOfPeople', () => {
        test('validate number of people', () => {
            assertValid(allFields.beneficiariesNumberOfPeople, faker.random.number({ min: 1, max: 10000 }));
            assertErrorContains(allFields.beneficiariesNumberOfPeople, undefined, 'is required');
            assertErrorContains(allFields.beneficiariesNumberOfPeople, Infinity, 'contains an invalid value');
        });
    });

    describe('beneficiariesLocationCheck', () => {
        test('validate yes/no choice', () => {
            assertValid(allFields.beneficiariesLocationCheck, 'yes');
            assertValid(allFields.beneficiariesLocationCheck, 'no');
            assertErrorContains(allFields.beneficiariesLocationCheck, 'not-a-real-choice', 'must be one of [yes, no]');
            assertErrorContains(allFields.beneficiariesLocationCheck, undefined, 'is required');
        });
    });

    describe('beneficiariesLocalAuthority', () => {
        const schemaWithCheck = {
            [allFields.beneficiariesLocationCheck.name]: allFields.beneficiariesLocationCheck.schema,
            [allFields.beneficiariesLocalAuthority.name]: allFields.beneficiariesLocalAuthority.schema
        };

        test('not required if beneficiariesLocationCheck is no', () => {
            assertValid(allFields.beneficiariesLocalAuthority, 'aberdeenshire');
            assertValid(allFields.beneficiariesLocalAuthority, undefined);

            const { error } = Joi.validate({ [allFields.beneficiariesLocationCheck.name]: 'no' }, schemaWithCheck);
            expect(error).toBeNull();
        });

        test('required if beneficiariesLocationCheck is yes', () => {
            const validationResultA = Joi.validate(
                { [allFields.beneficiariesLocationCheck.name]: 'yes' },
                schemaWithCheck
            );

            expect(validationResultA.error.message).toContain('"beneficiaries-local-authority" is required');

            const validationResultB = Joi.validate(
                {
                    [allFields.beneficiariesLocationCheck.name]: 'yes',
                    [allFields.beneficiariesLocalAuthority.name]: 'aberdeenshire'
                },
                schemaWithCheck
            );
            expect(validationResultB.error).toBeNull();
        });
    });

    describe('beneficiariesLocalAuthority', () => {
        const schemaWithCheck = {
            [allFields.beneficiariesLocationCheck.name]: allFields.beneficiariesLocationCheck.schema,
            [allFields.beneficiariesLocalAuthority.name]: allFields.beneficiariesLocalAuthority.schema
        };

        test('not required if beneficiariesLocationCheck is no', () => {
            assertValid(allFields.beneficiariesLocalAuthority, 'aberdeenshire');
            assertValid(allFields.beneficiariesLocalAuthority, undefined);

            const { error } = Joi.validate({ [allFields.beneficiariesLocationCheck.name]: 'no' }, schemaWithCheck);
            expect(error).toBeNull();
        });

        test('required if beneficiariesLocationCheck is yes', () => {
            const validationResultA = Joi.validate(
                { [allFields.beneficiariesLocationCheck.name]: 'yes' },
                schemaWithCheck
            );

            expect(validationResultA.error.message).toContain('"beneficiaries-local-authority" is required');

            const validationResultB = Joi.validate(
                {
                    [allFields.beneficiariesLocationCheck.name]: 'yes',
                    [allFields.beneficiariesLocalAuthority.name]: 'aberdeenshire'
                },
                schemaWithCheck
            );
            expect(validationResultB.error).toBeNull();
        });
    });

    describe('beneficiariesLocationDescription', () => {
        const schemaWithCheck = {
            [allFields.beneficiariesLocationCheck.name]: allFields.beneficiariesLocationCheck.schema,
            [allFields.beneficiariesLocationDescription.name]: allFields.beneficiariesLocationDescription.schema
        };

        test('not required if beneficiariesLocationCheck is no', () => {
            assertValid(allFields.beneficiariesLocationDescription, faker.lorem.words(25));
            assertValid(allFields.beneficiariesLocationDescription, undefined);

            const { error } = Joi.validate({ [allFields.beneficiariesLocationCheck.name]: 'no' }, schemaWithCheck);
            expect(error).toBeNull();
        });

        test('required if beneficiariesLocationCheck is yes', () => {
            const validationResultA = Joi.validate(
                { [allFields.beneficiariesLocationCheck.name]: 'yes' },
                schemaWithCheck
            );

            expect(validationResultA.error.message).toContain('"beneficiaries-location-description" is required');

            const validationResultB = Joi.validate(
                {
                    [allFields.beneficiariesLocationCheck.name]: 'yes',
                    [allFields.beneficiariesLocationDescription.name]: faker.lorem.words(25)
                },
                schemaWithCheck
            );
            expect(validationResultB.error).toBeNull();
        });
    });

    describe('organisationLegalName', () => {
        test('validate organisation legal name', () => {
            assertValid(allFields.organisationLegalName, faker.company.companyName());
            assertErrorContains(allFields.organisationLegalName, undefined, 'is required');
            assertErrorContains(allFields.organisationLegalName, Infinity, 'must be a string');
        });
    });

    describe('organisationAlias', () => {
        test('optional field', () => {
            assertValid(allFields.organisationAlias, undefined);
            assertValid(allFields.organisationAlias, faker.company.companyName());
            assertErrorContains(allFields.organisationAlias, Infinity, 'must be a string');
        });
    });

    describe('organisationAddress', () => {
        test('must be a full valid address', () => {
            assertValid(allFields.organisationAddress, mockAddress());
            assertErrorContains(allFields.organisationAddress, undefined, 'is required');

            assertErrorContains(
                allFields.organisationAddress,
                {
                    'building-street': '3 Embassy Drive',
                    'county': 'West Midlands',
                    'postcode': 'B15 1TR'
                },
                'child "town-city" fails because ["town-city" is required]'
            );

            assertErrorContains(
                allFields.organisationAddress,
                { ...mockAddress(), ...{ postcode: 'not a postcode' } },
                'fails to match the required pattern'
            );
        });
    });

    describe('organisationType', () => {
        test('must be a valid organisation type', () => {
            assertValid(allFields.organisationType, 'unregistered-vco');
            assertErrorContains(allFields.organisationType, undefined, 'is required');
            assertErrorContains(
                allFields.organisationType,
                'not-an-option',
                'must be one of [unregistered-vco, unincorporated-registered-charity, charitable-incorporated-organisation, not-for-profit-company, school, statutory-body]'
            );
        });
    });

    function assertRequiredForOrganistionTypes(field, requiredTypes) {
        const schemaWithOrgType = {
            'organisation-type': allFields.organisationType.schema,
            [field.name]: field.schema
        };

        requiredTypes.forEach(type => {
            const { error } = Joi.validate({ 'organisation-type': type }, schemaWithOrgType);
            expect(error.message).toContain('is required');
        });
    }

    describe('companyNumber', () => {
        test('conditionally required based on organisation type', () => {
            assertValid(allFields.companyNumber, 'CE002712');
            assertValid(allFields.companyNumber, undefined);

            assertRequiredForOrganistionTypes(allFields.companyNumber, [ORGANISATION_TYPES.NOT_FOR_PROFIT_COMPANY]);
        });
    });

    describe('charityNumber', () => {
        test('conditionally required based on organisation type', () => {
            assertValid(allFields.charityNumber, '1160580');
            assertValid(allFields.charityNumber, undefined);

            assertRequiredForOrganistionTypes(allFields.charityNumber, [
                ORGANISATION_TYPES.UNINCORPORATED_REGISTERED_CHARITY,
                ORGANISATION_TYPES.CIO
            ]);
        });
    });

    describe('educationNumber', () => {
        test('conditionally required based on organisation type', () => {
            assertValid(allFields.educationNumber, '1160580');
            assertValid(allFields.educationNumber, undefined);

            assertRequiredForOrganistionTypes(allFields.educationNumber, [ORGANISATION_TYPES.SCHOOL]);
        });
    });

    describe('accountingYearDate', () => {
        test('must be a valid day and month', () => {
            assertValid(allFields.accountingYearDate, { day: 12, month: 2 });
            assertErrorContains(allFields.accountingYearDate, null, 'must be an object');
            assertErrorContains(allFields.accountingYearDate, { day: 31, month: 2 }, 'contains an invalid value');
        });
    });

    describe('totalIncomeYear', () => {
        test('must be a valid number', () => {
            assertValid(allFields.totalIncomeYear, 1000);
            assertErrorContains(allFields.totalIncomeYear, undefined, 'is required');
            assertErrorContains(allFields.totalIncomeYear, Infinity, 'contains an invalid value');
        });
    });

    function testContactNamePart(field) {
        test('valid string', () => {
            assertValid(field, faker.name.findName());
            assertErrorContains(field, undefined, 'is required');
            assertErrorContains(field, Infinity, 'must be a string');
        });
    }

    function testContactDateOfBirth(field, minAge) {
        test(`must be at least ${minAge} years old`, () => {
            const randomDob = moment().subtract(
                faker.random.number({
                    min: minAge,
                    max: 100
                }),
                'years'
            );

            assertValid(field, toDateParts(randomDob));

            const invalidDob = moment().subtract(minAge - 1, 'years');
            assertErrorContains(field, toDateParts(invalidDob), `Must be at least ${minAge} years old`);
        });

        test('optional if organisation-type is a school or statutory-body', () => {
            const schemaWithOrgType = {
                'organisation-type': allFields.organisationType.schema,
                [field.name]: field.schema
            };

            const optionalOrgTypes = [ORGANISATION_TYPES.SCHOOL, ORGANISATION_TYPES.STATUTORY_BODY];
            optionalOrgTypes.forEach(type => {
                const { error } = Joi.validate({ 'organisation-type': type }, schemaWithOrgType);

                expect(error).toBeNull();
            });
        });
    }

    function testContactAddress(field) {
        test('must be a full valid address', () => {
            assertValid(field, mockAddress());
            assertErrorContains(field, null, 'must be an object');

            assertErrorContains(
                field,
                {
                    'building-street': '3 Embassy Drive',
                    'county': 'West Midlands',
                    'postcode': 'B15 1TR'
                },
                'child "town-city" fails because ["town-city" is required]'
            );

            assertErrorContains(
                field,
                { ...mockAddress(), ...{ postcode: 'not a postcode' } },
                'fails to match the required pattern'
            );
        });

        test('optional if organisation-type is a school or statutory-body', () => {
            const schemaWithOrgType = {
                'organisation-type': allFields.organisationType.schema,
                [field.name]: field.schema
            };

            const optionalOrgTypes = [ORGANISATION_TYPES.SCHOOL, ORGANISATION_TYPES.STATUTORY_BODY];
            optionalOrgTypes.forEach(type => {
                const { error } = Joi.validate({ 'organisation-type': type }, schemaWithOrgType);
                expect(error).toBeNull();
            });
        });
    }

    function testContactAddressHistory(field) {
        test('require address history if less than three years at current address', () => {
            assertValid(field, {
                'current-address-meets-minimum': 'yes'
            });

            assertErrorContains(
                field,
                { 'current-address-meets-minimum': null },
                '"current-address-meets-minimum" must be a string'
            );

            assertErrorContains(
                field,
                { 'current-address-meets-minimum': 'not-a-valid-choice' },
                '"current-address-meets-minimum" must be one of [yes, no]'
            );

            const partialAddress = {
                'building-street': faker.address.streetAddress(),
                'town-city': faker.address.city()
            };

            assertErrorContains(
                field,
                {
                    'current-address-meets-minimum': 'no',
                    'previous-address': partialAddress
                },
                '"postcode" is required'
            );

            assertValid(field, {
                'current-address-meets-minimum': 'no',
                'previous-address': mockAddress()
            });
        });

        test('optional if organisation-type is a school or statutory-body', () => {
            const schemaWithOrgType = {
                'organisation-type': allFields.organisationType.schema,
                [field.name]: field.schema
            };

            const optionalOrgTypes = [ORGANISATION_TYPES.SCHOOL, ORGANISATION_TYPES.STATUTORY_BODY];
            optionalOrgTypes.forEach(type => {
                const validationResultA = Joi.validate({ 'organisation-type': type }, schemaWithOrgType);
                expect(validationResultA.error).toBeNull();
            });
        });
    }

    function testContactEmail(field) {
        test('valid email address', () => {
            assertValid(field, faker.internet.exampleEmail());
            assertErrorContains(field, undefined, 'is required');
            assertErrorContains(field, Infinity, 'must be a string');
        });
    }

    function testContactPhone(field) {
        test('valid uk phone number', () => {
            assertValid(field, '0345 4 10 20 30');
            assertErrorContains(field, undefined, 'is required');
            assertErrorContains(field, NaN, 'must be a string');
            assertErrorContains(field, 'not a phone number', 'did not seem to be a phone number');
        });
    }

    function testContactCommunicationNeeds(field) {
        test('validates optional choice', () => {
            assertValid(field, undefined);
            assertValid(field, 'audiotape');
            assertErrorContains(
                field,
                'invalid',
                'must be one of [audiotape, braille, disk, large-print, letter, sign-language, text-relay]'
            );
        });
    }

    describe('mainContactName', () => {
        testContactNamePart(allFields.mainContactFirstName);
        testContactNamePart(allFields.mainContactLastName);
    });

    describe('mainContactDob', () => {
        testContactDateOfBirth(allFields.mainContactDob, 16);
    });

    describe('mainContactAddress', () => {
        testContactAddress(allFields.mainContactAddress);
    });

    describe('mainContactAddressHistory', () => {
        testContactAddressHistory(allFields.mainContactAddressHistory);
    });

    describe('mainContactEmail', () => {
        testContactEmail(allFields.mainContactEmail);
    });

    describe('mainContactPhone', () => {
        testContactPhone(allFields.mainContactPhone);
    });

    describe('mainContactCommunicationNeeds', () => {
        testContactCommunicationNeeds(allFields.mainContactCommunicationNeeds);
    });

    describe('seniorContactName', () => {
        testContactNamePart(allFields.seniorContactFirstName);
        testContactNamePart(allFields.seniorContactLastName);
    });

    describe('seniorContactRole', () => {
        test('must be a valid role', () => {
            assertValid(allFields.seniorContactRole, 'chair');
            assertErrorContains(allFields.seniorContactRole, undefined, 'is required');
            assertErrorContains(allFields.seniorContactRole, Infinity, 'must be a string');
        });
    });

    describe('seniorContactDob', () => {
        testContactDateOfBirth(allFields.seniorContactDob, 18);
    });

    describe('seniorContactAddress', () => {
        testContactAddress(allFields.seniorContactAddress);
    });

    describe('seniorContactAddressHistory', () => {
        testContactAddressHistory(allFields.seniorContactAddressHistory);
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
        test('valid account name', () => {
            assertValid(allFields.bankAccountName, faker.company.companyName());
            assertErrorContains(allFields.bankAccountName, undefined, 'is required');
            assertErrorContains(allFields.bankAccountName, Infinity, 'must be a string');
        });
    });

    describe('bankSortCode', () => {
        test('valid sort code', () => {
            assertValid(allFields.bankSortCode, '108800');
            assertErrorContains(allFields.bankSortCode, undefined, 'is required');
            assertErrorContains(allFields.bankSortCode, Infinity, 'must be a string');
        });
    });

    describe('bankAccountNumber', () => {
        test('valid account number', () => {
            assertValid(allFields.bankAccountNumber, '00012345');
            assertErrorContains(allFields.bankAccountNumber, undefined, 'is required');
            assertErrorContains(allFields.bankAccountNumber, Infinity, 'must be a string');
        });
    });

    describe('bankBuildingSocietyNumber', () => {
        test('optional field', () => {
            assertValid(allFields.bankBuildingSocietyNumber);
            assertErrorContains(allFields.bankBuildingSocietyNumber, Infinity, 'must be a string');
            assertValid(allFields.bankBuildingSocietyNumber, '1234566');
        });
    });

    describe('bankStatement', () => {
        test('valid bank statement upload', () => {
            assertValid(allFields.bankStatement, 'example.pdf');
            assertErrorContains(allFields.bankStatement, undefined, 'is required');
            assertErrorContains(allFields.bankStatement, Infinity, 'must be a string');
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

    test('validate model shape', () => {
        validateModel(formBuilder({ locale: 'en' }));
    });

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
                    organisationType: ORGANISATION_TYPES.UNINCORPORATED_REGISTERED_CHARITY,
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

    test('return conditional role choices based on organisation type', () => {
        const mappings = {
            '': [],
            [ORGANISATION_TYPES.UNREGISTERED_VCO]: ['chair', 'vice-chair', 'secretary', 'treasurer'],
            [ORGANISATION_TYPES.UNINCORPORATED_REGISTERED_CHARITY]: ['trustee'],
            [ORGANISATION_TYPES.CIO]: ['trustee'],
            [ORGANISATION_TYPES.NOT_FOR_PROFIT_COMPANY]: ['company-director', 'company-secretary'],
            [ORGANISATION_TYPES.SCHOOL]: ['head-teacher', 'chancellor', 'vice-chancellor'],
            [ORGANISATION_TYPES.STATUTORY_BODY]: ['parish-clerk', 'chief-executive']
        };

        map(mappings, (expected, type) => {
            const form = formBuilder({ locale: 'en', data: { 'organisation-type': type } });
            expect(form.allFields.seniorContactRole.options.map(o => o.value)).toEqual(expected);
        });
    });

    function fieldNamesFor(sectionSlug, stepTitle) {
        return function(data) {
            const form = formBuilder({ locale: 'en', data: data });
            const section = form.sections.find(s => s.slug === sectionSlug);
            const step = section.steps.find(s => s.title === stepTitle);
            return map(flatMap(step.fieldsets, 'fields'), f => f.name);
        };
    }

    test('conditional beneficiary location questions', () => {
        const fieldNamesFn = fieldNamesFor('beneficiaries', 'Location');

        expect(fieldNamesFn({})).toEqual([]);

        expect(
            fieldNamesFn({
                'beneficiaries-location-check': 'no'
            })
        ).toEqual([]);

        expect(
            fieldNamesFn({
                'beneficiaries-location-check': 'yes'
            })
        ).toEqual(['beneficiaries-local-authority', 'beneficiaries-location-description']);
    });

    test('registration numbers shown based on organisation type', () => {
        const fieldNamesFn = fieldNamesFor('organisation', 'Registration numbers');

        expect(fieldNamesFn({})).toEqual([]);

        const mappings = {
            [ORGANISATION_TYPES.UNINCORPORATED_REGISTERED_CHARITY]: ['charity-number'],
            [ORGANISATION_TYPES.CIO]: ['charity-number'],
            [ORGANISATION_TYPES.NOT_FOR_PROFIT_COMPANY]: ['company-number', 'charity-number'],
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
        expect(mainContactFn({ 'organisation-type': ORGANISATION_TYPES.SCHOOL })).toEqual(mainContactReducedFields);
        expect(mainContactFn({ 'organisation-type': ORGANISATION_TYPES.STATUTORY_BODY })).toEqual(
            mainContactReducedFields
        );

        const seniorContactFn = fieldNamesFor('senior-contact', 'Senior contact');

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
        expect(seniorContactFn({ 'organisation-type': ORGANISATION_TYPES.SCHOOL })).toEqual(seniorContactReducedFields);
        expect(seniorContactFn({ 'organisation-type': ORGANISATION_TYPES.STATUTORY_BODY })).toEqual(
            seniorContactReducedFields
        );
    });
});
