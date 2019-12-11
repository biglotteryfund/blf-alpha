/* eslint-env jest */
// @ts-nocheck
'use strict';
const confirmationBuilder = require('./confirmation');

describe('confirmation builder', () => {
    test('should return confirmation text based on country', () => {
        const england = confirmationBuilder({
            locale: 'en',
            data: { projectCountry: 'england' }
        });

        expect(england.body).toMatchSnapshot();

        const scotland = confirmationBuilder({
            locale: 'en',
            data: { projectCountry: 'scotland' }
        });

        expect(scotland.body).toMatchSnapshot();
    });
});
