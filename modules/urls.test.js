'use strict';
/* global describe, it */
const chai = require('chai');
const expect = chai.expect;

const { stripTrailingSlashes, generateUrlList } = require('./urls');

describe('URL Helpers', () => {
    describe('#stripTrailingSlashes', () => {
        it('should strip trailing slashes correctly', done => {
            let pathWithSlash = '/foo/';
            let pathWithoutSlash = '/bar';
            let pathToHomepage = '/';
            expect(stripTrailingSlashes(pathWithSlash)).to.equal('/foo');
            expect(stripTrailingSlashes(pathWithoutSlash)).to.equal('/bar');
            expect(stripTrailingSlashes(pathToHomepage)).to.equal('/');
            done();
        });
    });

    describe('#generateUrlList', () => {
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
            programmeRedirects: [
                {
                    path: '/global-content/programmes/example',
                    destination: '/funding/programmes/example',
                    isPostable: false,
                    allowQueryStrings: false,
                    live: true
                }
            ],
            vanityRedirects: [
                {
                    path: '/test',
                    live: true
                },
                {
                    paths: ['/supports', '/multiple', '/redirects'],
                    live: true
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

        it('should filter out non-live routes', done => {
            let urlList = generateUrlList(testRoutes);
            expect(urlList.newSite.length).to.equal(11);
            done();
        });

        it('should generate the correct section/page path', done => {
            let urlList = generateUrlList(testRoutes);
            expect(urlList.newSite.filter(r => r.path === '/purple/monkey/dishwasher').length).to.equal(1);
            done();
        });

        it('should generate welsh versions of canonical routes', done => {
            let urlList = generateUrlList(testRoutes);
            expect(urlList.newSite.filter(r => r.path === '/welsh/purple/monkey/dishwasher').length).to.equal(1);
            done();
        });

        it('should store properties against routes', done => {
            let urlList = generateUrlList(testRoutes);
            expect(urlList.newSite.filter(r => r.path === '/unicorns')[0].isPostable).to.equal(true);
            done();
        });
    });
});
