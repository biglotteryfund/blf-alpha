'use strict';
/* eslint-env mocha*/
const chai = require('chai');
const expect = chai.expect;

const { getCachebustedPath, getCachebustedRealPath, getImagePath } = require('./assets');

describe('assets', () => {
    it('should get cachebusted url path for an asset', () => {
        const result = getCachebustedPath('stylesheets/style.css');
        expect(result).to.match(/^\/assets\/build\/\w+\/stylesheets\/style.css$/);
    });

    it('should get cachebusted real path for an asset', () => {
        const result = getCachebustedRealPath('stylesheets/style.css');
        expect(result).to.match(/^\/build\/\w+\/stylesheets\/style.css$/);
    });

    it('should get path for a given image', () => {
        const result = getImagePath('path/to/image.png');
        expect(result).to.equal('/assets/images/path/to/image.png');
    });
});
