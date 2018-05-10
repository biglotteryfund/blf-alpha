/* eslint-env mocha */
'use strict';

const chai = require('chai');
const expect = chai.expect;

const { createSection, basicRoute, staticRoute, dynamicRoute, cmsRoute, legacyRoute } = require('./route-types');

describe('Route types', () => {
    it('should create a new section', () => {
        const section = createSection({
            path: '/example',
            langTitlePath: 'global.nav.about'
        });

        section.addRoutes({
            exampleSection: staticRoute({
                path: '/some/url'
            })
        });

        expect(section.path).to.equal('/example');
        expect(section.find('exampleSection')).to.equal('/example/some/url');
        expect(() => section.find('doesNotExist')).to.throw('No route found for doesNotExist');
    });

    it('should define a basic route schema', () => {
        expect(
            basicRoute({
                path: '/some/url'
            })
        ).to.eql({
            path: '/some/url',
            isPostable: false,
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
            static: true,
            live: true
        });
    });

    it('should define a dynamic route schema', () => {
        expect(
            dynamicRoute({
                path: '/some/url',
                queryStrings: ['foo', 'bar']
            })
        ).to.eql({
            path: '/some/url',
            isPostable: false,
            static: false,
            live: true,
            queryStrings: ['foo', 'bar']
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
            allowAllQueryStrings: true,
            live: true
        });
    });
});
