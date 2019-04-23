'use strict';
/* eslint-env jest */
const faker = require('faker');
const moment = require('moment');
const Joi = require('joi');

const { allFields } = require('./fields');
const { mockAddress, mockBudget } = require('./mocks');

const toDateParts = dt => ({
    day: dt.get('date'),
    month: dt.get('month') + 1,
    year: dt.get('year')
});

describe('applicationTitle', () => {
    test('valid', () => {
        const { error } = allFields.applicationTitle.schema.validate(faker.lorem.words(5));
        expect(error).toBeNull();
    });

    test('invalid', () => {
        const { error } = allFields.applicationTitle.schema.validate('');
        expect(error.message).toContain('not allowed to be empty');
    });
});

describe('applicationCountry', () => {
    test('valid', () => {
        const { error } = allFields.applicationCountry.schema.validate(
            faker.random.arrayElement(['england', 'northern-ireland', 'scotland', 'wales'])
        );
        expect(error).toBeNull();
    });

    test('invalid', () => {
        const { error } = allFields.applicationCountry.schema.validate('not-a-country');
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

describe('yourIdea', () => {
    test('valid', () => {
        const { error } = allFields.yourIdea.schema.validate(faker.lorem.paragraphs(4));
        expect(error).toBeNull();
    });

    test('at least 50 workds', () => {
        const { error } = allFields.yourIdea.schema.validate(faker.lorem.words(49));
        expect(error.message).toContain('must have at least 50 words');
    });

    test('no more than 500 words', () => {
        const { error } = allFields.yourIdea.schema.validate(faker.lorem.words(550));
        expect(error.message).toContain('must have less than 500 words');
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
});

describe('organisationLegalName', () => {
    test.todo('valid');
    test.todo('invalid');
});

describe('organisationAlias', () => {
    test.todo('valid');
    test.todo('optional');
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
            county: 'West Midlands',
            postcode: 'B15 1TR'
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
            { 'organisation-type': allFields.organisationType.schema, 'company-number': allFields.companyNumber.schema }
        );

        expect(error.message).toContain('is required');

        expect(allFields.companyNumber.shouldShow()).toBeFalsy();
        expect(allFields.companyNumber.shouldShow({ 'organisation-type': 'not-for-profit-company' })).toBeTruthy();
        expect(allFields.companyNumber.shouldShow({ 'organisation-type': 'school' })).toBeFalsy();
    });
});

describe('charityNumber', () => {
    const schemaWithOrgType = {
        'organisation-type': allFields.organisationType.schema,
        'charity-number': allFields.charityNumber.schema
    };

    test('valid', () => {
        const { error } = allFields.charityNumber.schema.validate('1160580');
        expect(error).toBeNull();
    });

    test('optional by default', () => {
        const { error } = allFields.charityNumber.schema.validate();
        expect(error).toBeNull();
    });

    test('required if unincorporated registered charity', () => {
        const { error } = Joi.validate({ 'organisation-type': 'unincorporated-registered-charity' }, schemaWithOrgType);

        expect(error.message).toContain('is required');

        expect(allFields.charityNumber.shouldShow()).toBeFalsy();
        expect(
            allFields.charityNumber.shouldShow({ 'organisation-type': 'unincorporated-registered-charity' })
        ).toBeTruthy();
    });

    test('required if cio', () => {
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
        const { error } = Joi.validate({ 'organisation-type': 'not-for-profit-company' }, schemaWithOrgType);

        expect(error).toBeNull();

        expect(allFields.charityNumber.shouldShow()).toBeFalsy();
        expect(allFields.charityNumber.shouldShow({ 'organisation-type': 'not-for-profit-company' })).toBeTruthy();
    });
});

describe('accountingYearDate', () => {
    test.todo('valid');
    test.todo('invalid');
    test.todo('missing');
});

describe('totalIncomeYear', () => {
    test.todo('valid');
    test.todo('invalid');
    test.todo('missing');
});

function testContactName(field) {
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
            county: 'West Midlands',
            postcode: 'B15 1TR'
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
            county: 'West Midlands',
            postcode: 'B15 1TR'
        });
        expect(error.message).toEqual('child "town-city" fails because ["town-city" is required]');
    });

    test('invalid postcode', () => {
        const { error } = field.schema.validate({
            'building-street': '3 Embassy Drive',
            'town-city': 'Edgbaston, Birmingham',
            county: 'West Midlands',
            postcode: 'not a postcode'
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
        expect(error.message).toContain('must be one of [audiotape, braille, large-print]');
    });

    test('optional', () => {
        const { error } = field.schema.validate();
        expect(error).toBeNull();
    });
}

describe('mainContactName', () => {
    testContactName(allFields.mainContactName);
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

describe('legalContactAddress', () => {
    testContactAddress(allFields.legalContactAddress);
});

describe('legalContactEmail', () => {
    testContactEmail(allFields.legalContactEmail);
});

describe('legalContactPhone', () => {
    testContactPhone(allFields.legalContactPhone);
});

describe('legalContactCommunicationNeeds', () => {
    testContactCommunicationNeeds(allFields.legalContactCommunicationNeeds);
});

describe('legalContactName', () => {
    testContactName(allFields.legalContactName);
});

describe('legalContactRole', () => {
    test.todo('valid');
    test.todo('invalid');
    test.todo('missing');
});

describe('legalContactDob', () => {
    test('valid', () => {
        const dt = moment().subtract(18, 'years');
        const { error } = allFields.legalContactDob.schema.validate(toDateParts(dt));
        expect(error).toBeNull();
    });

    test('at least 18 years old', () => {
        const dt = moment().subtract(17, 'years');
        const { error } = allFields.legalContactDob.schema.validate(toDateParts(dt));
        expect(error.message).toContain('Must be at least 18 years old');
    });

    test('not required if organisation-type is a school or statutory-body', () => {
        const { error } = Joi.validate(
            { 'organisation-type': 'school' },
            {
                'organisation-type': allFields.organisationType.schema,
                'main-contact-dob': allFields.legalContactDob.schema
            }
        );

        expect(error).toBeNull();

        expect(allFields.legalContactDob.shouldShow()).toBeTruthy();
        expect(allFields.legalContactDob.shouldShow({ 'organisation-type': 'unregistered-vco' })).toBeTruthy();
        expect(allFields.legalContactDob.shouldShow({ 'organisation-type': 'school' })).toBeFalsy();
        expect(allFields.legalContactDob.shouldShow({ 'organisation-type': 'statutory-body' })).toBeFalsy();
    });
});

describe('legalContactAddress', () => {
    testContactAddress(allFields.legalContactAddress);
});

describe('legalContactEmail', () => {
    testContactEmail(allFields.legalContactEmail);
});

describe('legalContactPhone', () => {
    testContactPhone(allFields.legalContactPhone);
});

describe('legalContactCommunicationNeeds', () => {
    testContactCommunicationNeeds(allFields.legalContactCommunicationNeeds);
});

describe('bankAccountName', () => {
    test.todo('valid');
    test.todo('invalid');
    test.todo('missing');
});

describe('bankSortCode', () => {
    test.todo('valid');
    test.todo('invalid');
    test.todo('missing');
});

describe('bankAccountNumber', () => {
    test.todo('valid');
    test.todo('invalid');
    test.todo('missing');
});

describe('bankBuildingSocietyNumber', () => {
    test.todo('valid');
    test.todo('invalid');
    test.todo('missing');
});

describe('bankStatement', () => {
    test.todo('valid');
    test.todo('invalid');
    test.todo('missing');
});
