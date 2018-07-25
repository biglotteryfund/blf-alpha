/* eslint-env jest */
'use strict';

const { getCurrentSection } = require('../viewGlobals');

describe('View Globals', () => {
    describe('#getCurrentSection', () => {
        it('should return navigation section for a given page', () => {
            expect(getCurrentSection('toplevel', 'home')).toBe('toplevel');
            expect(getCurrentSection('funding', 'root')).toBe('funding');
            expect(getCurrentSection('funding', 'programmes')).toBe('funding');
            expect(getCurrentSection('about', 'root')).toBe('about');
            expect(getCurrentSection('toplevel', 'over10k')).toBeUndefined();
        });
    });
});
