/* eslint-env jest */
'use strict';
const aliases = require('./aliases');

/**
 * The list of redirects is largely static but includes
 * some dynamic generation of welsh language and multi-region
 * versions of each URL. A snapshot test is a quick way of us
 * confirming that each alias has the expected variants.
 */
test('should export mappedAliases', () => {
    expect(aliases).toMatchSnapshot();
});
