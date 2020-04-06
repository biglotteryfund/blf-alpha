/* eslint-env jest */
'use strict';

const filters = require('./filters');

test('append a uuid', () => {
    expect(filters.appendUuid('hello-')).toMatch(/hello-.*/);
});

test('should format a number with comma separators', () => {
    expect(filters.numberWithCommas(1548028)).toBe('1,548,028');
});

test('slugify a string', () => {
    expect(filters.slugify('This is a test')).toBe('this-is-a-test');
});

test('prevent typographic widows', () => {
    expect(filters.widont('A string')).toBe('A&nbsp;string');
    expect(filters.widont('A slightly longer string')).toBe(
        'A slightly longer&nbsp;string'
    );
});
