/* eslint-env jest */
'use strict';

const { createSection, staticRoute, customRoute, cmsRoute, legacyRoute } = require('./route-types');

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

        expect(section.path).toBe('/example');
        expect(section.find('exampleSection')).toBe('/example/some/url');
        expect(() => section.find('doesNotExist')).toThrowError('No route found for doesNotExist');
    });

    it('should define a custom route schema', () => {
        expect(
            customRoute({
                path: '/some/url',
                queryStrings: ['foo', 'bar']
            })
        ).toEqual({
            path: '/some/url',
            isPostable: false,
            live: true,
            queryStrings: ['foo', 'bar']
        });
    });

    it('should define a static route schema', () => {
        expect(
            staticRoute({
                path: '/some/url'
            })
        ).toEqual({
            path: '/some/url',
            isPostable: false,
            static: true,
            live: true
        });
    });

    it('should define a cmsRoute schema', () => {
        expect(
            cmsRoute({
                path: '/some/url'
            })
        ).toEqual({
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
        ).toEqual({
            path: '/some/url',
            isPostable: true,
            allowAllQueryStrings: true,
            live: true
        });
    });
});
