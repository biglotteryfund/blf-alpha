/* eslint-env jest */
'use strict';
const aliases = require('../aliases');

describe('alises', () => {
    it('should export mappedAliases', () => {
        expect(aliases).toMatchSnapshot();
    });
});
