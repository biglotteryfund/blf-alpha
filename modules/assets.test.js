/* eslint-env jest */
'use strict';

const { getCachebustedPath, getCachebustedRealPath, getImagePath } = require('./assets');

describe('assets', () => {
    it('should get cachebusted url path for an asset', () => {
        const result = getCachebustedPath('stylesheets/style.css');
        expect(result).toMatch(/\/assets\/build\/\w+\/stylesheets\/style.css$/);
    });

    it('should get cachebusted real path for an asset', () => {
        const result = getCachebustedRealPath('stylesheets/style.css');
        expect(result).toMatch(/^\/build\/\w+\/stylesheets\/style.css$/);
    });

    it('should get path for a given image', () => {
        const result = getImagePath('path/to/image.png');
        expect(result).toBe('/assets/images/path/to/image.png');
    });
});
