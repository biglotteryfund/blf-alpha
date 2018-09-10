/* eslint-env jest */
'use strict';
const config = require('config');
const { sessionRoute, legacyRoute } = require('../route-types');

describe('Route types', () => {
    it('should define a session route schema', () => {
        const route = sessionRoute({ path: '/some/url' });
        expect(route).toEqual({
            path: '/some/url',
            isPostable: true,
            cookies: [config.get('cookies.session')]
        });
    });

    it('should define a legacy schema', () => {
        const route = legacyRoute({ path: '/some/url' });
        expect(route).toEqual({
            path: '/some/url',
            isPostable: true,
            allowAllQueryStrings: true
        });
    });
});
