/* eslint-env jest */
'use strict';
const confirmationBuilder = require('./confirmation');

test.each(['england', 'northern-ireland'])(
    'should return confirmation text for %p',
    function (country) {
        const result = confirmationBuilder({
            locale: 'en',
            data: { projectCountries: [country] },
        });

        expect(result.body).toMatchSnapshot();
    }
);
