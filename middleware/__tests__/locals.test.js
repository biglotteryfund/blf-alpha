/* eslint-env jest */
'use strict';

const { getCurrentSection, getMetaTitle } = require('../locals');

describe('locals middleware', () => {
    it('should return navigation section for a given page', () => {
        expect(getCurrentSection('toplevel', 'home')).toBe('toplevel');
        expect(getCurrentSection('funding', 'root')).toBe('funding');
        expect(getCurrentSection('funding', 'programmes')).toBe('funding');
        expect(getCurrentSection('about', 'root')).toBe('about');
        expect(getCurrentSection('toplevel', 'over10k')).toBeUndefined();
    });

    it('should return meta title for page', () => {
        expect(getMetaTitle('Big Lottery Fund', 'Example')).toBe('Example | Big Lottery Fund');
        expect(getMetaTitle('Big Lottery Fund')).toBe('Big Lottery Fund');
    });
});
