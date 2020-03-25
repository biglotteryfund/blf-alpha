/* eslint-env jest */
'use strict';
const confirmationBuilder = require('./confirmation');

test('should return confirmation text based on country', () => {
    const england = confirmationBuilder({
        locale: 'en',
        data: { projectCountry: 'england' },
    });

    expect(england.body).toMatchSnapshot();

    const scotland = confirmationBuilder({
        locale: 'en',
        data: { projectCountry: 'scotland' },
    });

    expect(scotland.body).toMatchSnapshot();
});
