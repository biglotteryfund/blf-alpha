'use strict';
/* global describe, it */
const chai = require('chai');
const expect = chai.expect;

const m = require('./urls');

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

describe('Cloudfront route generator', () => {
    it('should filter out non-live routes', done => {
        let urlList = m.generateUrlList(testRoutes);
        expect(urlList.newSite.length).to.equal(9);
        done();
    });

    it('should generate the correct section/page path', done => {
        let urlList = m.generateUrlList(testRoutes);
        expect(urlList.newSite.filter(r => r.path === '/purple/monkey/dishwasher').length).to.equal(1);
        done();
    });

    it('should generate welsh versions of canonical routes', done => {
        let urlList = m.generateUrlList(testRoutes);
        expect(urlList.newSite.filter(r => r.path === '/welsh/purple/monkey/dishwasher').length).to.equal(1);
        done();
    });

    it('should store properties against routes', done => {
        let urlList = m.generateUrlList(testRoutes);
        expect(urlList.newSite.filter(r => r.path === '/unicorns')[0].isPostable).to.equal(true);
        done();
    });
});
