/* eslint-env jest */
'use strict';
const config = require('config');

const { cloudfrontRules } = require('../../controllers/routes');
const cloudfrontDistributions = config.get('aws.cloudfrontDistributions');

const { makeBehaviourItem, generateBehaviours } = require('../cloudfront');

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
    const behaviours = generateBehaviours({
        cloudfrontRules: cloudfrontRules,
        origins: cloudfrontDistributions.live.origins
    });

    expect(behaviours).toMatchSnapshot();
});
