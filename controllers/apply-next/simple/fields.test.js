'use strict';
/* eslint-env jest */
/* @TODO: It would be nice to also validate the messages from `normaliseErrors` here. */

const faker = require('faker');
const Joi = require('joi');
const moment = require('moment');
const { allFields } = require('./fields');
const { applicationTitle, applicationCountry, projectStartDate, mainContactDob } = allFields;

const toDateParts = dt => ({
    day: dt.get('day'),
    month: dt.get('month') + 1,
    year: dt.get('year')
});

describe('applicationTitle', () => {
    test('valid', () => {
        const { error } = Joi.validate(faker.lorem.words(5), applicationTitle.schema);
        expect(error).toBeNull();
    });

    test('invalid', () => {
        const { error } = Joi.validate('', applicationTitle.schema);
        expect(error.message).toContain('not allowed to be empty');
    });
});

describe('applicationCountry', () => {
    test('valid', () => {
        const { error } = Joi.validate(
            faker.random.arrayElement(['england', 'northern-ireland', 'scotland', 'wales']),
            applicationCountry.schema
        );
        expect(error).toBeNull();
    });

    test('invalid', () => {
        const { error } = Joi.validate('not-a-country', applicationCountry.schema);
        expect(error.message).toContain('must be one of [england, northern-ireland, scotland, wales]');
    });
});

describe('projectStartDate', () => {
    test('valid', () => {
        const dt = moment().add(12, 'weeks');
        const { error } = Joi.validate(toDateParts(dt), projectStartDate.schema);
        expect(error).toBeNull();
    });

    test('missing', () => {
        const { error } = Joi.validate(null, projectStartDate.schema);
        expect(error.message).toContain('must be an object');
    });

    test('invalid', () => {
        const { error } = Joi.validate({ day: 31, month: 2, year: 2030 }, projectStartDate.schema);
        expect(error.message).toContain('contains an invalid value');
    });

    test('less than 12 weeks in the future', () => {
        const dt = moment().add(6, 'weeks');
        const { error } = Joi.validate(toDateParts(dt), projectStartDate.schema);
        expect(error.message).toContain('Date must be at least');
    });
});

describe('mainContactDob', () => {
    test('valid', () => {
        const dt = moment().subtract(18, 'years');
        const { error } = Joi.validate(toDateParts(dt), mainContactDob.schema);
        expect(error).toBeNull();
    });

    test('under 18', () => {
        const dt = moment().subtract(16, 'years');
        const { error } = Joi.validate(toDateParts(dt), mainContactDob.schema);
        expect(error.message).toContain('Must be at least 18 years old');
    });

    test('not required if organisation-type is a school', () => {
        const dt = moment().subtract(18, 'years');
        const { error } = Joi.validate(toDateParts(dt), mainContactDob.schema, {
            context: { 'organisation-type': 'school' }
        });
        expect(error).toBeNull();
    });
});
