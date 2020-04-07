/* eslint-env jest */
'use strict';
const confirmationBuilder = require('./confirmation');

test('should return confirmation text based on country', () => {
    const england = confirmationBuilder({
        locale: 'en',
        data: {
            projectCountry: 'england',
            mainContactName: { firstName: 'Bob', lastName: 'Example' },
            mainContactEmail: 'bob@example.com',
            seniorContactName: { firstName: 'Ann', lastName: 'Example' },
            seniorContactEmail: 'ann@example.com',
        },
    });

    expect(england.body).toMatchSnapshot();

    const scotland = confirmationBuilder({
        locale: 'en',
        data: {
            projectCountry: 'scotland',
            mainContactName: { firstName: 'Bob', lastName: 'Example' },
            mainContactEmail: 'bob@example.com',
            seniorContactName: { firstName: 'Ann', lastName: 'Example' },
            seniorContactEmail: 'ann@example.com',
        },
    });

    expect(scotland.body).toMatchSnapshot();
});
