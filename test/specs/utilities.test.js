'use strict';
/* global describe, it */
const chai = require('chai');
const expect = chai.expect;

const utilities = require('../../modules/utilities');

const testRoutes = {
    sections: {
        purple: {
            path: '/purple',
            pages: {
                monkey: {
                    path: '/monkey/dishwasher',
                    live: true,
                    isWildcard: false,
                    isPostable: false,
                    aliases: ['/green/orangutan/fridge']
                }
            }
        }
    },
    vanityRedirects: [
        {
            path: '/test'
        },
        {
            paths: ['/supports', '/multiple', '/redirects']
        }
    ],
    otherUrls: [
        {
            path: '/unicorns',
            isPostable: true,
            live: true
        },
        {
            path: '/draft',
            live: false
        }
    ]
};

describe('utility functions', () => {
    it('should strip trailing slashes correctly', done => {
        let pathWithSlash = '/foo/';
        let pathWithoutSlash = '/bar';
        let pathToHomepage = '/';
        expect(utilities.stripTrailingSlashes(pathWithSlash)).to.equal('/foo');
        expect(utilities.stripTrailingSlashes(pathWithoutSlash)).to.equal('/bar');
        expect(utilities.stripTrailingSlashes(pathToHomepage)).to.equal('/');
        done();
    });

    it('should parse numbers from text strings correctly', done => {
        const exampleRanges = [
            ['£10,000 - £1 million', 1000000],
            ['£10,000 - £150,000', 150000],
            ['£10,000 - £1 million', 1000000],
            ['£300 - £10,000', 10000],
            ['£10,000 - £1 million', 1000000],
            ['£10,000 - £1 million', 1000000],
            ['£10,000 - £50,000', 50000],
            ['foo', 'foo']
        ];

        exampleRanges.forEach(e => {
            let input = e[0];
            let output = e[1];
            expect(utilities.parseValueFromString(input)).to.equal(output);
        });

        done();
    });
});

describe('Cloudfront route generator', () => {
    it('should filter out non-live routes', done => {
        let urlList = utilities.generateUrlList(testRoutes);
        expect(urlList.newSite.length).to.equal(9);
        done();
    });

    it('should generate the correct section/page path', done => {
        let urlList = utilities.generateUrlList(testRoutes);
        expect(urlList.newSite.filter(r => r.path === '/purple/monkey/dishwasher').length).to.equal(1);
        done();
    });

    it('should generate welsh versions of canonical routes', done => {
        let urlList = utilities.generateUrlList(testRoutes);
        expect(urlList.newSite.filter(r => r.path === '/welsh/purple/monkey/dishwasher').length).to.equal(1);
        done();
    });

    it('should store properties against routes', done => {
        let urlList = utilities.generateUrlList(testRoutes);
        expect(urlList.newSite.filter(r => r.path === '/unicorns')[0].isPostable).to.equal(true);
        done();
    });
});
