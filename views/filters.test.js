/* eslint-env jest */
'use strict';

const {
    appendUuid,
    getCachebustedPath,
    isArray,
    mailto,
    numberWithCommas,
    slugify,
    widont
} = require('./filters');

describe('appendUuid', () => {
    it('should append a uuid', () => {
        expect(appendUuid('hello-')).toMatch(/hello-.*/);
    });
});

describe('getCachebustedPath', () => {
    it('should get local url path cachebusted asset', () => {
        const result = getCachebustedPath('stylesheets/style.css', false);
        expect(result).toMatch(
            /^\/assets\/build\/\w+\/stylesheets\/style.css$/
        );
    });

    it('should get external url for cachebusted asset', () => {
        const result = getCachebustedPath('stylesheets/style.css', true);
        expect(result).toMatch(
            /^\/assets\/build\/\w+\/stylesheets\/style.css$/
        );
    });
});

describe('mailto', () => {
    it('should create a mailto link', () => {
        expect(mailto('example@example.com')).toBe(
            '<a href="mailto:example@example.com">example@example.com</a>'
        );
    });
});

describe('numberWithCommas', () => {
    it('should format a number with comma separators', () => {
        expect(numberWithCommas(1548028)).toBe('1,548,028');
    });
});

describe('slugify', () => {
    it('should slugify a string', () => {
        expect(slugify('This is a test')).toBe('this-is-a-test');
    });
});

describe('isArray', () => {
    it('should check for arrays', () => {
        expect(isArray('not an array')).toBeFalsy();
        expect(isArray(['an', 'array'])).toBeTruthy();
        expect(isArray({ prop: 'thing' })).toBeFalsy();
    });
});

describe('widont', () => {
    it('should add a non-breaking-space to the last word of a string to prevent typographic widows', () => {
        expect(widont('A string')).toBe('A&nbsp;string');
        expect(widont('A slightly longer string')).toBe(
            'A slightly longer&nbsp;string'
        );
    });
});
