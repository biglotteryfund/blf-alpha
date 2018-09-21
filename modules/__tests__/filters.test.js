/* eslint-env jest */
'use strict';

const {
    addQueryParam,
    appendUuid,
    getCachebustedPath,
    getImagePath,
    isArray,
    mailto,
    makePhoneLink,
    numberWithCommas,
    pluralise,
    removeQueryParam,
    slugify
} = require('../filters');

describe('appendUuid', () => {
    it('should append a uuid', () => {
        expect(appendUuid('hello-')).toMatch(/hello-.*/);
    });
});

describe('getCachebustedPath', () => {
    it('should get local url path cachebusted asset', () => {
        const result = getCachebustedPath('stylesheets/style.css', false);
        expect(result).toMatch(/^\/assets\/build\/\w+\/stylesheets\/style.css$/);
    });

    it('should get external url for cachebusted asset', () => {
        const result = getCachebustedPath('stylesheets/style.css', true);
        expect(result).toMatch(/^https:\/\/media.biglotteryfund.org.uk\/assets\/build\/\w+\/stylesheets\/style.css$/);
    });
});

describe('getImagePath', () => {
    it('should get path for a given image', () => {
        const result = getImagePath('path/to/image.png');
        expect(result).toBe('/assets/images/path/to/image.png');
    });

    it('should return original url if external url', () => {
        const result = getImagePath('https://example.com/image.png');
        expect(result).toBe('https://example.com/image.png');
    });
});

describe('makePhoneLink', () => {
    it('should create a tel link', () => {
        expect(makePhoneLink('0121 555 5555')).toBe(
            '<a href="tel:01215555555" class="is-phone-link">0121 555 5555</a>'
        );
    });
});

describe('mailto', () => {
    it('should create a mailto link', () => {
        expect(mailto('example@example.com')).toBe('<a href="mailto:example@example.com">example@example.com</a>');
    });
});

describe('numberWithCommas', () => {
    it('should format a number with comma separators', () => {
        expect(numberWithCommas(1548028)).toBe('1,548,028');
    });
});

describe('pluralise', () => {
    it('should pluralise string', () => {
        expect(pluralise(0, 'octopus', 'octopi')).toBe('octopi');
        expect(pluralise(1, 'octopus', 'octopi')).toBe('octopus');
        expect(pluralise(3, 'octopus', 'octopi')).toBe('octopi');
    });
});

describe('addQueryParam', () => {
    it('should add a query parameter', () => {
        expect(
            addQueryParam(
                {
                    something: 'example'
                },
                [['programme_id', 12]]
            )
        ).toBe('something=example&programme_id=12');
    });

    it('should add multiple query parameters', () => {
        expect(
            addQueryParam(
                {
                    something: 'example'
                },
                [['programme_id', 12], ['sort', 'date']]
            )
        ).toBe('something=example&programme_id=12&sort=date');
    });
});

describe('removeQueryParam', () => {
    it('should remove a query parameter', () => {
        expect(
            removeQueryParam(
                {
                    something: 'example',
                    programme_id: '12'
                },
                'programme_id'
            )
        ).toBe('something=example');
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
