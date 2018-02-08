/* eslint-env mocha */
const chai = require('chai');
const expect = chai.expect;

const { basicRoute, staticRoute, dynamicRoute, cmsRoute, legacyRoute, vanity } = require('./route-types');

describe('Route types', () => {
    it('should define a basic route schema', () => {
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

    it('should define a static route schema', () => {
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

    it('should define a dynamic route schema', () => {
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

    it('should define a cmsRoute schema', () => {
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

    it('should define a legacy schema', () => {
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

    it('should define a vanity redirect schema', () => {
        expect(vanity('/from/url', '/to/url')).to.eql({
            path: '/from/url',
            destination: '/to/url',
            isPostable: false,
            allowQueryStrings: false,
            live: true
        });
    });
});
