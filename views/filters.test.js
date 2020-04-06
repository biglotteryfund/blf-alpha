/* eslint-env jest */
'use strict';

const filters = require('./filters');

test('filter', function () {
    const input = [
        { name: 'a', location: 'england' },
        { name: 'b', location: 'england' },
        { name: 'c', location: 'scotland' },
        { name: 'd', location: 'wales' },
        { name: 'e', location: 'northern-ireland' },
    ];

    const result = filters.filter(input, 'location', 'england');
    expect(result).toStrictEqual([
        { name: 'a', location: 'england' },
        { name: 'b', location: 'england' },
    ]);
});

test('find', function () {
    const input = [
        { name: 'a', location: 'england' },
        { name: 'b', location: 'england' },
        { name: 'c', location: 'scotland' },
        { name: 'd', location: 'wales' },
        { name: 'e', location: 'northern-ireland' },
    ];

    const result = filters.find(input, 'name', 'a');
    expect(result).toStrictEqual({ name: 'a', location: 'england' });
});

test('numberWithCommas', () => {
    expect(filters.numberWithCommas(1548028)).toBe('1,548,028');
});

test('slugify', () => {
    expect(filters.slugify('This is a test')).toBe('this-is-a-test');
});

test('widont', () => {
    expect(filters.widont('A string')).toBe('A&nbsp;string');
    expect(filters.widont('A slightly longer string')).toBe(
        'A slightly longer&nbsp;string'
    );
});

test('addQueryParam', () => {
    const input = { a: 'a', b: 'b' };
    const result = filters.addQueryParam(input, 'c', 'added');
    expect(result).toBe('a=a&b=b&c=added');
});

test('removeQueryParam', () => {
    const input = { a: 'a', b: 'b' };
    const result = filters.removeQueryParam(input, 'b');
    expect(result).toBe('a=a');
});

test('appendUuid', () => {
    expect(filters.appendUuid('hello-')).toMatch(/hello-.*/);
});
