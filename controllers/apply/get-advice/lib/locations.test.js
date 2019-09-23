/* eslint-env jest */
'use strict';
const locationsFor = require('./locations');

test.each(['england', 'northern-ireland', 'scotland', 'wales'])(
    `include expected locations for %p`,
    function(country) {
        expect(locationsFor([country])).toMatchSnapshot();
    }
);

test('empty options for multiple countries', function() {
    expect(locationsFor(['england', 'wales'])).toEqual([]);
});
