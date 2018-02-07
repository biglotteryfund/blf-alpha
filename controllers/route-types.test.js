/* eslint-env mocha */
const chai = require('chai');
const expect = chai.expect;

const { basicRoute, staticRoute, dynamicRoute, cmsRoute, legacyRoute } = require('./route-types');

describe('Route types', () => {
    it('should define a basic route', () => {
        expect(
            basicRoute({
                path: '/some/url'
            })
        ).to.eql({
            path: '/some/url',
            isPostable: false,
            allowQueryStrings: false,
            live: true
        });

        expect(
            basicRoute({
                path: '/some/url',
                live: false
            })
        ).to.eql({
            path: '/some/url',
            isPostable: false,
            allowQueryStrings: false,
            live: false
        });
    });

    it('should define a static route', () => {
        expect(
            staticRoute({
                path: '/some/url'
            })
        ).to.eql({
            path: '/some/url',
            isPostable: false,
            allowQueryStrings: false,
            static: true,
            live: true
        });
    });

    it('should define a dynamic route', () => {
        expect(
            dynamicRoute({
                path: '/some/url'
            })
        ).to.eql({
            path: '/some/url',
            isPostable: false,
            allowQueryStrings: false,
            static: false,
            live: true
        });
    });

    it('should define a cmsRoute route', () => {
        expect(
            cmsRoute({
                path: '/some/url'
            })
        ).to.eql({
            path: '/some/url',
            isPostable: false,
            allowQueryStrings: false,
            useCmsContent: true,
            live: true
        });
    });

    it('should define a legacy route', () => {
        expect(
            legacyRoute({
                path: '/some/url'
            })
        ).to.eql({
            path: '/some/url',
            isPostable: true,
            allowQueryStrings: true,
            live: true
        });
    });
});
