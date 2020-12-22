/* eslint-env jest */
'use strict';
const terms = require('./terms');

test('default terms', function () {
    expect(terms('en', {})).toMatchSnapshot();
});
