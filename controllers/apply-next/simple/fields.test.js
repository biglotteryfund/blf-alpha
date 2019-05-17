/* eslint-env jest */
'use strict';
const { range, times } = require('lodash');
const faker = require('faker');
const Joi = require('@hapi/joi');

const { ORGANISATION_TYPES } = require('./constants');
const {
    mockStartDate,
    mockDateOfBirth,
    mockAddress,
    mockBudget
} = require('./mocks');

const fieldsFor = require('./fields');
const { fields } = fieldsFor({ locale: 'en' });

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
            assertValid(fields.projectName, faker.lorem.words(5));
            assertErrorContains(
                fields.projectName,
                '',
                'not allowed to be empty'
            );
        });
    });

    describe('projectCountry', () => {
        test('valididate project country', () => {
            assertValid(
                fields.projectCountry,
                faker.random.arrayElement([
                    'england',
                    'northern-ireland',
                    'scotland',
                    'wales'
                ])
            );
            assertErrorContains(
                fields.projectCountry,
                'not-a-country',
                'must be one of [england, northern-ireland, scotland, wales]'
            );
        });
    });

    describe('projectStartDate', () => {
        test('must be a valid date', () => {
            assertValid(fields.projectStartDate, mockStartDate(12));
            assertErrorContains(
                fields.projectStartDate,
                null,
                'must be an object'
            );
            assertErrorContains(
                fields.projectStartDate,
                { day: 31, month: 2, year: 2030 },
                'contains an invalid value'
            );
        });

        test('must be at least 12 weeks in the future', () => {
            const { error } = fields.projectStartDate.schema.validate(
                mockStartDate(6)
            );
            expect(error.message).toContain('Date must be at least');
        });
    });

    describe('projectPostcode', () => {
        test('must be a valid UK postcode', () => {
            assertValid(fields.projectPostcode, 'B15 1TR');
            assertErrorContains(
                fields.projectPostcode,
                null,
                'must be a string'
            );
            assertErrorContains(
                fields.projectPostcode,
                'not a postcode',
                'did not seem to be a valid postcode'
            );
        });
    });

    function testWordCountRange(field, min, max) {
        assertErrorContains(field, null, 'must be a string');

        const wordCountIncrement = faker.random.number({ min: 25, max: 100 });
        range(min, max, wordCountIncrement).forEach(wordCount => {
            assertValid(field, faker.lorem.words(wordCount));
        });

        assertErrorContains(
            field,
            faker.lorem.words(49),
            `must have at least ${min} words`
        );
        assertErrorContains(
            field,
            faker.lorem.words(301),
            `must have less than ${max} words`
        );
    }

    describe('yourIdeaProject', () => {
        test('must be between 50 and 300 words', () => {
            testWordCountRange(fields.yourIdeaProject, 50, 300);
        });
    });

    describe('yourIdeaPriorities', () => {
        test('must be between 50 and 150 words', () => {
            testWordCountRange(fields.yourIdeaPriorities, 50, 150);
        });
    });

    describe('yourIdeaCommunity', () => {
        test('must be between 50 and 200 words', () => {
            testWordCountRange(fields.yourIdeaCommunity, 50, 200);
        });
    });

    describe('projectBudget', () => {
        test('must provide a valid budget', () => {
            assertValid(fields.projectBudget, mockBudget());
        });

        test('must have at least one budget item', () => {
            assertErrorContains(
                fields.projectBudget,
                [],
                'must contain at least 1 items'
            );
        });

        test('total amount requested must not exceed £10,000', () => {
            const budget = times(10, () => ({
                item: faker.lorem.words(5),
                cost: 1100
            }));
            assertErrorContains(
                fields.projectBudget,
                budget,
                'over maximum budget'
            );
        });

        test('all items must contain both a description and a cost', () => {
            const budget = times(5, () => ({ item: faker.lorem.words(5) }));
            assertErrorContains(
                fields.projectBudget,
                budget,
                '"cost" is required'
            );
        });
    });

    describe('projectTotalCosts', () => {
        test('validate project total costs', () => {
            assertValid(fields.projectTotalCosts, 1000);
            assertErrorContains(
                fields.projectTotalCosts,
                undefined,
                'is required'
            );
            assertErrorContains(
                fields.projectTotalCosts,
                Infinity,
                'contains an invalid value'
            );
        });

        test('must be at least value of project budget', () => {
            const schemaWithProjectBudget = Joi.object({
                'project-budget': fields.projectBudget.schema,
                'project-total-costs': fields.projectTotalCosts.schema
            });

            const budget = times(2, () => ({
                item: faker.lorem.words(5),
                cost: 1100
            }));

            const validationResultValid = Joi.validate(
                { 'project-budget': budget, 'project-total-costs': 2200 },
                schemaWithProjectBudget
            );
            expect(validationResultValid.error).toBeNull();

            const validationResultInvalid = Joi.validate(
                { 'project-budget': budget, 'project-total-costs': 1000 },
                schemaWithProjectBudget
            );
            expect(validationResultInvalid.error.message).toContain(
                'under project budget total'
            );
        });
    });

    describe('organisationLegalName', () => {
        test('validate organisation legal name', () => {
            assertValid(
                fields.organisationLegalName,
                faker.company.companyName()
            );
            assertErrorContains(
                fields.organisationLegalName,
                undefined,
                'is required'
            );
            assertErrorContains(
                fields.organisationLegalName,
                Infinity,
                'must be a string'
            );
        });
    });

    describe('organisationTradingName', () => {
        test('optional field', () => {
            assertValid(fields.organisationTradingName, undefined);
            assertValid(
                fields.organisationTradingName,
                faker.company.companyName()
            );
            assertErrorContains(
                fields.organisationTradingName,
                Infinity,
                'must be a string'
            );
        });
    });

    describe('organisationAddress', () => {
        test('must be a full valid address', () => {
            assertValid(fields.organisationAddress, mockAddress());
            assertErrorContains(
                fields.organisationAddress,
                undefined,
                'is required'
            );

            assertErrorContains(
                fields.organisationAddress,
                {
                    'building-street': '3 Embassy Drive',
                    'county': 'West Midlands',
                    'postcode': 'B15 1TR'
                },
                'child "town-city" fails because ["town-city" is required]'
            );

            assertErrorContains(
                fields.organisationAddress,
                { ...mockAddress(), ...{ postcode: 'not a postcode' } },
                'did not seem to be a valid postcode'
            );
        });
    });

    describe('organisationType', () => {
        test('must be a valid organisation type', () => {
            assertValid(fields.organisationType, 'unregistered-vco');
            assertErrorContains(
                fields.organisationType,
                undefined,
                'is required'
            );
            assertErrorContains(
                fields.organisationType,
                'not-an-option',
                'must be one of [unregistered-vco, unincorporated-registered-charity, charitable-incorporated-organisation, not-for-profit-company, school, statutory-body]'
            );
        });
    });

    function assertRequiredForOrganistionTypes(field, requiredTypes) {
        const schemaWithOrgType = {
            'organisation-type': fields.organisationType.schema,
            [field.name]: field.schema
        };

        const requiredOrgTypes = requiredTypes;
        requiredOrgTypes.forEach(type => {
            const { error } = Joi.validate(
                { 'organisation-type': type },
                schemaWithOrgType
            );
            expect(error.message).toContain('is required');
        });
    }

    describe('companyNumber', () => {
        test('conditionally required based on organisation type', () => {
            assertValid(fields.companyNumber, 'CE002712');
            assertValid(fields.companyNumber, undefined);

            assertRequiredForOrganistionTypes(fields.companyNumber, [
                ORGANISATION_TYPES.NOT_FOR_PROFIT_COMPANY
            ]);
        });
    });

    describe('charityNumber', () => {
        test('conditionally required based on organisation type', () => {
            assertValid(fields.charityNumber, '1160580');
            assertValid(fields.charityNumber, undefined);

            assertRequiredForOrganistionTypes(fields.charityNumber, [
                ORGANISATION_TYPES.UNINCORPORATED_REGISTERED_CHARITY,
                ORGANISATION_TYPES.CIO
            ]);
        });
    });

    describe('educationNumber', () => {
        test('conditionally required based on organisation type', () => {
            assertValid(fields.educationNumber, '1160580');
            assertValid(fields.educationNumber, undefined);

            assertRequiredForOrganistionTypes(fields.educationNumber, [
                ORGANISATION_TYPES.SCHOOL
            ]);
        });
    });

    describe('accountingYearDate', () => {
        test('must be a valid day and month', () => {
            assertValid(fields.accountingYearDate, { day: 12, month: 2 });
            assertErrorContains(
                fields.accountingYearDate,
                null,
                'must be an object'
            );
            assertErrorContains(
                fields.accountingYearDate,
                { day: 31, month: 2 },
                'contains an invalid value'
            );
        });
    });

    describe('totalIncomeYear', () => {
        test('must be a valid number', () => {
            assertValid(fields.totalIncomeYear, 1000);
            assertErrorContains(
                fields.totalIncomeYear,
                undefined,
                'is required'
            );
            assertErrorContains(
                fields.totalIncomeYear,
                Infinity,
                'contains an invalid value'
            );
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
            assertValid(field, mockDateOfBirth(minAge));
            assertErrorContains(
                field,
                mockDateOfBirth(0, minAge - 1),
                `Must be at least ${minAge} years old`
            );
        });

        test('optional if organisation-type is a school or statutory-body', () => {
            const schemaWithOrgType = {
                'organisation-type': fields.organisationType.schema,
                [field.name]: field.schema
            };

            const optionalOrgTypes = [
                ORGANISATION_TYPES.SCHOOL,
                ORGANISATION_TYPES.STATUTORY_BODY
            ];
            optionalOrgTypes.forEach(type => {
                const { error } = Joi.validate(
                    { 'organisation-type': type },
                    schemaWithOrgType
                );

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
                'did not seem to be a valid postcode'
            );
        });

        test('optional if organisation-type is a school or statutory-body', () => {
            const schemaWithOrgType = {
                'organisation-type': fields.organisationType.schema,
                [field.name]: field.schema
            };

            const optionalOrgTypes = [
                ORGANISATION_TYPES.SCHOOL,
                ORGANISATION_TYPES.STATUTORY_BODY
            ];
            optionalOrgTypes.forEach(type => {
                const { error } = Joi.validate(
                    { 'organisation-type': type },
                    schemaWithOrgType
                );
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
                'organisation-type': fields.organisationType.schema,
                [field.name]: field.schema
            };

            const optionalOrgTypes = [
                ORGANISATION_TYPES.SCHOOL,
                ORGANISATION_TYPES.STATUTORY_BODY
            ];
            optionalOrgTypes.forEach(type => {
                const validationResultA = Joi.validate(
                    { 'organisation-type': type },
                    schemaWithOrgType
                );
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
            assertErrorContains(
                field,
                'not a phone number',
                'did not seem to be a phone number'
            );
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
        testContactNamePart(fields.mainContactFirstName);
        testContactNamePart(fields.mainContactLastName);
    });

    describe('mainContactDob', () => {
        testContactDateOfBirth(fields.mainContactDob, 16);
    });

    describe('mainContactAddress', () => {
        testContactAddress(fields.mainContactAddress);
    });

    describe('mainContactAddressHistory', () => {
        testContactAddressHistory(fields.mainContactAddressHistory);
    });

    describe('mainContactEmail', () => {
        testContactEmail(fields.mainContactEmail);
    });

    describe('mainContactPhone', () => {
        testContactPhone(fields.mainContactPhone);
    });

    describe('mainContactCommunicationNeeds', () => {
        testContactCommunicationNeeds(fields.mainContactCommunicationNeeds);
    });

    describe('seniorContactName', () => {
        testContactNamePart(fields.seniorContactFirstName);
        testContactNamePart(fields.seniorContactLastName);
    });

    describe('seniorContactRole', () => {
        test('must be a valid role', () => {
            assertValid(fields.seniorContactRole, 'chair');
            assertErrorContains(
                fields.seniorContactRole,
                undefined,
                'is required'
            );
            assertErrorContains(
                fields.seniorContactRole,
                Infinity,
                'must be a string'
            );
        });

        test('include all roles if no organisation type is provided', () => {
            expect(
                fields.seniorContactRole.options.map(option => option.value)
            ).toEqual([
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
                const { fields: _fields } = fieldsFor({
                    locale: 'en',
                    data: { 'organisation-type': type }
                });

                expect(
                    _fields.seniorContactRole.options.map(
                        option => option.value
                    )
                ).toEqual(expected);
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
    });

    describe('seniorContactDob', () => {
        testContactDateOfBirth(fields.seniorContactDob, 18);
    });

    describe('seniorContactAddress', () => {
        testContactAddress(fields.seniorContactAddress);
    });

    describe('seniorContactAddressHistory', () => {
        testContactAddressHistory(fields.seniorContactAddressHistory);
    });

    describe('seniorContactEmail', () => {
        testContactEmail(fields.seniorContactEmail);
    });

    describe('seniorContactPhone', () => {
        testContactPhone(fields.seniorContactPhone);
    });

    describe('seniorContactCommunicationNeeds', () => {
        testContactCommunicationNeeds(fields.seniorContactCommunicationNeeds);
    });

    describe('bankAccountName', () => {
        test('valid account name', () => {
            assertValid(fields.bankAccountName, faker.company.companyName());
            assertErrorContains(
                fields.bankAccountName,
                undefined,
                'is required'
            );
            assertErrorContains(
                fields.bankAccountName,
                Infinity,
                'must be a string'
            );
        });
    });

    describe('bankSortCode', () => {
        test('valid sort code', () => {
            assertValid(fields.bankSortCode, '108800');
            assertErrorContains(fields.bankSortCode, undefined, 'is required');
            assertErrorContains(
                fields.bankSortCode,
                Infinity,
                'must be a string'
            );
        });
    });

    describe('bankAccountNumber', () => {
        test('valid account number', () => {
            assertValid(fields.bankAccountNumber, '00012345');
            assertErrorContains(
                fields.bankAccountNumber,
                undefined,
                'is required'
            );
            assertErrorContains(
                fields.bankAccountNumber,
                Infinity,
                'must be a string'
            );
        });
    });

    describe('bankBuildingSocietyNumber', () => {
        test('optional field', () => {
            assertValid(fields.bankBuildingSocietyNumber);
            assertErrorContains(
                fields.bankBuildingSocietyNumber,
                Infinity,
                'must be a string'
            );
            assertValid(fields.bankBuildingSocietyNumber, '1234566');
        });
    });

    describe('bankStatement', () => {
        test('valid bank statement upload', () => {
            assertValid(fields.bankStatement, 'example.pdf');
            assertErrorContains(fields.bankStatement, undefined, 'is required');
            assertErrorContains(
                fields.bankStatement,
                Infinity,
                'must be a string'
            );
        });
    });
});
