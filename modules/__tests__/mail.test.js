/* eslint-env jest */
'use strict';
const { getSendAddress } = require('../mail-helpers');

describe('mail', () => {
    const expectedDefault = `noreply@biglotteryfund.org.uk`;
    const expectedInternal = `noreply@blf.digital`;

    it('it should return default send from address for external send to addresses', () => {
        expect(getSendAddress('example@example.com')).toBe(expectedDefault);
        expect(getSendAddress('example@gmail.com')).toBe(expectedDefault);
    });

    it('should return internal send from address for internal send to addresses', () => {
        expect(getSendAddress('example@biglotteryfund.org.uk')).toBe(expectedInternal);
        // Assert against similar looking but incorrect emails to test for false positives
        expect(getSendAddress('example@biggerlotteryfund.org.uk')).toBe(expectedDefault);
        expect(getSendAddress('example@biggestlotteryfund.org.uk')).toBe(expectedDefault);
        expect(getSendAddress('biglotteryfund.org.uk@example.com')).toBe(expectedDefault);
    });
});
