/* eslint-env jest */
// @ts-nocheck
'use strict';
const confirmationBuilder = require('./confirmation');
const { CONTACT_DETAILS_EMAIL, CONTACT_DETAILS_PHONE } = require('./constants');

describe('confirmation builder', () => {
    test('should return confirmation text based on country', () => {
        const england = confirmationBuilder({
            locale: 'en',
            data: { projectCountry: 'england' }
        });

        expect(england.body).toMatchSnapshot();
        expect(england.body).toContain(CONTACT_DETAILS_PHONE.england);
        expect(england.body).toContain(CONTACT_DETAILS_EMAIL.england);
        expect(england.body).toContain('18 weeks');

        const scotland = confirmationBuilder({
            locale: 'en',
            data: { projectCountry: 'scotland' }
        });

        expect(scotland.body).toMatchSnapshot();
        expect(scotland.body).toContain(CONTACT_DETAILS_PHONE.scotland);
        expect(scotland.body).toContain(CONTACT_DETAILS_EMAIL.scotland);
        expect(scotland.body).toContain('18 weeks');
    });
});
