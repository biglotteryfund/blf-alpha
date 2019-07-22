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
        expect(england.body).toContain('0345 4 10 20 30');
        expect(england.body).toContain('afe@tnlcommunityfund.org.uk');
        expect(england.body).toContain('18 weeks');

        const scotland = confirmationBuilder({
            locale: 'en',
            data: { projectCountry: 'scotland' }
        });

        expect(scotland.body).toMatchSnapshot();
        expect(scotland.body).toContain('0300 123 7110');
        expect(scotland.body).toContain(
            'advicescotland@tnlcommunityfund.org.uk'
        );
        expect(scotland.body).toContain('18 weeks');
    });
});
