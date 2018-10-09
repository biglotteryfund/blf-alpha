/* eslint-env jest */
'use strict';

const { getMetaTitle } = require('../locals');

describe('locals middleware', () => {
    it('should return meta title for page', () => {
        expect(getMetaTitle('Big Lottery Fund', 'Example')).toBe('Example | Big Lottery Fund');
        expect(getMetaTitle('Big Lottery Fund')).toBe('Big Lottery Fund');
    });
});
