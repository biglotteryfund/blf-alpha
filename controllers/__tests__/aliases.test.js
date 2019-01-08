/* eslint-env jest */
'use strict';
const aliases = require('../aliases');

describe('aliases', () => {
    it('should export mappedAliases', () => {
        expect(aliases).toMatchSnapshot();
    });
});
