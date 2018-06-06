/* eslint-env jest */
'use strict';

const { toSeconds } = require('./cached');

describe('cached', () => {
    it('should convert natural time to seconds', () => {
        expect(toSeconds('10s')).toBe(10);
        expect(toSeconds('30m')).toBe(1800);
    });
});
