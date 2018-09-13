/* eslint-env jest */
'use strict';
const { makeBehaviourItem, generateBehaviours } = require('../cloudfront-config');

describe('#makeBehaviourItem', () => {
    it('should return cloudfront behaviour for route', () => {
        const behaviour = makeBehaviourItem({
            originId: 'BLF_EXAMPLE',
            pathPattern: '/',
            isPostable: true,
            queryStringWhitelist: ['q'],
            cookiesInUse: ['example']
        });

        expect(behaviour).toMatchSnapshot();
    });

    it('should allow all cookies and querystrings', () => {
        const behaviour = makeBehaviourItem({
            originId: 'BLF_LEGACY_EXAMPLE',
            pathPattern: '/~/*',
            isPostable: true,
            allowAllQueryStrings: true,
            allowAllCookies: true,
            protocol: 'allow-all',
            headersToKeep: ['*']
        });

        expect(behaviour).toMatchSnapshot();
    });
});

describe('generateBehaviours', () => {
    const liveBehaviours = generateBehaviours('live');
    expect(liveBehaviours).toMatchSnapshot();
});
