/* eslint-env jest */
'use strict';

const { isValidPostcode } = require('./fields');

describe('Postcode validation', () => {
    it('should correctly validate postcodes', () => {
        expect(isValidPostcode('EC4A 1DE')).toBe(true);
    });
    it('should reject invalid postcodes', () => {
        expect(isValidPostcode('NOT A POSTCODE')).toBe(false);
    });
});
