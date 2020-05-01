/* eslint-env jest */
'use strict';
const { newContact } = require('./contact-schema');
const validateSchema = require('../../../common/validate-schema');

describe('ebulletin contact schema', () => {
    test('new contact', () => {

        expect(
            validateSchema(newContact(), {
                email: 'just@email.com',
            }).messages
        ).toEqual([
            {
                param: 'firstName',
                type: 'base',
            },
            {
                param: 'lastName',
                type: 'base',
            },
            {
                param: 'location',
                type: 'base',
            },
        ]);

        expect(
            validateSchema(newContact(), {
                email: 'not-an-email',
                firstName: 'Paul',
                lastName: 'McCartney',
            }).messages
        ).toEqual([
            {
                param: 'email',
                type: 'string.email',
            },
            {
                param: 'location',
                type: 'base',
            },
        ]);

        expect(
            validateSchema(newContact(), {
                email: 'john@apple.com',
                firstName: 'John',
                lastName: 'Lennon',
                location: 'Liverpool'
            }).messages
        ).toEqual([
            {
                param: 'location',
                type: 'base',
            },
        ]);

    });
});
